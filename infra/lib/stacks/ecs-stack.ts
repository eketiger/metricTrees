import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps {
  cfg: AppConfig;
  vpc: ec2.IVpc;
  repository: ecr.IRepository;
  secrets: Record<string, sm.ISecret>;
  hostedZone: route53.IHostedZone;
  certificate: acm.ICertificate;
}

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly fargateService: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { cfg, vpc, repository, secrets } = props;

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `${cfg.appName}-${cfg.environment}`,
      vpc,
      containerInsights: true,
    });

    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: cfg.taskCpu,
      memoryLimitMiB: cfg.taskMemoryMiB,
    });

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${cfg.appName}/${cfg.environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const secretRefs: Record<string, ecs.Secret> = {};
    for (const [key, secret] of Object.entries(secrets)) {
      const envVar = key.toUpperCase().replace(/-/g, '_');
      secretRefs[envVar] = ecs.Secret.fromSecretsManager(secret);
    }

    this.taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      portMappings: [{ containerPort: 3000 }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'app', logGroup }),
      secrets: secretRefs,
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const serviceSg = new ec2.SecurityGroup(this, 'ServiceSg', { vpc, allowAllOutbound: true });

    this.fargateService = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: cfg.desiredCount,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [serviceSg],
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', { vpc, internetFacing: true });
    const httpsListener = this.alb.addListener('Https', {
      port: 443,
      certificates: [props.certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });
    this.alb.addListener('Http', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({ protocol: 'HTTPS', port: '443', permanent: true }),
    });
    httpsListener.addTargets('App', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.fargateService],
      healthCheck: { path: '/api/health', interval: cdk.Duration.seconds(30) },
      stickinessCookieDuration: undefined,
    });

    serviceSg.addIngressRule(
      ec2.Peer.securityGroupId(this.alb.connections.securityGroups[0].securityGroupId),
      ec2.Port.tcp(3000),
      'ALB → service',
    );

    new route53.ARecord(this, 'ApexA', {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(this.alb)),
    });
    new route53.ARecord(this, 'WwwA', {
      zone: props.hostedZone,
      recordName: `www.${cfg.domainName}`,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(this.alb)),
    });
  }
}
