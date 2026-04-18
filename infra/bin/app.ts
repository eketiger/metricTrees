#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { configFor, Environment } from '../lib/config';
import { NetworkStack } from '../lib/stacks/network-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { DnsStack } from '../lib/stacks/dns-stack';
import { EcsStack } from '../lib/stacks/ecs-stack';
import { CdnStack } from '../lib/stacks/cdn-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { IamStack } from '../lib/stacks/iam-stack';

const app = new cdk.App();
const envName = (app.node.tryGetContext('env') ?? 'staging') as Environment;
const cfg = configFor(envName);
const env = { account: cfg.awsAccountId, region: cfg.awsRegion };

const network = new NetworkStack(app, `Network-${envName}`, { cfg, env });
const ecr = new EcrStack(app, `Ecr-${envName}`, { cfg, env });
const secrets = new SecretsStack(app, `Secrets-${envName}`, { cfg, env });
const dns = new DnsStack(app, `Dns-${envName}`, { cfg, env });
const ecs = new EcsStack(app, `Ecs-${envName}`, {
  cfg,
  env,
  vpc: network.vpc,
  repository: ecr.repository,
  secrets: secrets.secrets,
  hostedZone: dns.hostedZone,
  certificate: dns.certificate,
});
new CdnStack(app, `Cdn-${envName}`, {
  cfg,
  env,
  alb: ecs.alb,
  hostedZone: dns.hostedZone,
  certificate: dns.certificate,
});
new MonitoringStack(app, `Monitoring-${envName}`, {
  cfg,
  env,
  cluster: ecs.cluster,
  service: ecs.fargateService,
  alb: ecs.alb,
});
new IamStack(app, `Iam-${envName}`, {
  cfg,
  env,
  repository: ecr.repository,
  cluster: ecs.cluster,
  service: ecs.fargateService,
});
