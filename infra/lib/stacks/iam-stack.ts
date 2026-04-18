import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps {
  cfg: AppConfig;
  repository: ecr.IRepository;
  cluster: ecs.ICluster;
  service: ecs.IService;
}

export class IamStack extends cdk.Stack {
  public readonly ghActionsRoleArn: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(this, 'GithubOidc', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const role = new iam.Role(this, 'GhActionsRole', {
      roleName: `${props.cfg.appName}-${props.cfg.environment}-github-actions`,
      assumedBy: new iam.FederatedPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          StringLike: {
            'token.actions.githubusercontent.com:sub':
              `repo:${props.cfg.githubOrg}/${props.cfg.appName}:ref:refs/heads/main`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    role.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:PutImage',
        'ecr:InitiateLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:CompleteLayerUpload',
      ],
      resources: [props.repository.repositoryArn, '*'],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['ecs:RegisterTaskDefinition', 'ecs:DescribeTaskDefinition', 'ecs:DescribeServices', 'ecs:UpdateService', 'ecs:RunTask'],
      resources: ['*'],
    }));

    this.ghActionsRoleArn = role.roleArn;
    new cdk.CfnOutput(this, 'GhActionsRoleArn', { value: role.roleArn });
  }
}
