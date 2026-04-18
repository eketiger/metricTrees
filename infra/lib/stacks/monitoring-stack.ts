import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps {
  cfg: AppConfig;
  cluster: ecs.ICluster;
  service: ecs.IService;
  alb: elbv2.IApplicationLoadBalancer;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const topic = new sns.Topic(this, 'AlarmTopic');
    topic.addSubscription(new subs.EmailSubscription(props.cfg.alarmEmail));

    const alarm = (name: string, metric: cw.IMetric, threshold: number, evalPeriods = 3) => {
      const a = new cw.Alarm(this, name, {
        metric, threshold, evaluationPeriods: evalPeriods,
        comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
      a.addAlarmAction(new actions.SnsAction(topic));
    };

    alarm('HighCpu', props.service.metricCpuUtilization(), 80, 5);
    alarm('HighMemory', props.service.metricMemoryUtilization(), 85, 5);

    new cw.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.cfg.appName}-${props.cfg.environment}`,
      widgets: [[
        new cw.GraphWidget({ title: 'CPU', left: [props.service.metricCpuUtilization()] }),
        new cw.GraphWidget({ title: 'Memory', left: [props.service.metricMemoryUtilization()] }),
      ]],
    });
  }
}
