import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps { cfg: AppConfig; }

const SECRET_KEYS = [
  'database-url',
  'nextauth-secret',
  'google-client-secret',
  'github-client-secret',
  'stripe-secret-key',
  'stripe-webhook-secret',
  'anthropic-api-key',
  'openai-api-key',
  'pinecone-api-key',
] as const;

export class SecretsStack extends cdk.Stack {
  public readonly secrets: Record<string, sm.Secret>;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const prefix = `/${props.cfg.appName}/${props.cfg.environment}`;
    this.secrets = {};
    for (const key of SECRET_KEYS) {
      this.secrets[key] = new sm.Secret(this, `Secret-${key}`, {
        secretName: `${prefix}/${key}`,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }

    new ssm.StringParameter(this, 'NextAuthUrl', {
      parameterName: `${prefix}/NEXTAUTH_URL`,
      stringValue: `https://${props.cfg.domainName}`,
    });
    for (const p of [
      'GOOGLE_CLIENT_ID',
      'GITHUB_CLIENT_ID',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_MIXPANEL_TOKEN',
    ]) {
      new ssm.StringParameter(this, `Param-${p}`, {
        parameterName: `${prefix}/${p}`,
        stringValue: 'REPLACE_ME',
      });
    }
    new ssm.StringParameter(this, 'PineconeIndexName', {
      parameterName: `${prefix}/PINECONE_INDEX_NAME`,
      stringValue: `${props.cfg.appName}-knowledge-base`,
    });
  }
}
