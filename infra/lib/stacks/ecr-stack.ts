import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps { cfg: AppConfig; }

export class EcrStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    this.repository = new ecr.Repository(this, 'Repo', {
      repositoryName: `${props.cfg.appName}-${props.cfg.environment}`,
      imageScanOnPush: true,
      lifecycleRules: [
        { tagPrefixList: ['sha-'], maxImageCount: 10 },
        { tagStatus: ecr.TagStatus.UNTAGGED, maxImageAge: cdk.Duration.days(7) },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
