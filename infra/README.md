# Metrics — AWS CDK Infrastructure

CDK (TypeScript) app that provisions the AWS infrastructure for Metrics.

## Prerequisites
- Node 20+, AWS CLI, CDK bootstrapped in the target account.

## Commands
```bash
npm install
npx cdk bootstrap aws://<accountId>/<region>
npm run synth                 # dry-run
cdk deploy -c env=staging     # deploy staging
cdk deploy -c env=production  # deploy production
```

## Stacks
1. **Network** — VPC with 2 AZs, 1–2 NAT gateways, flow logs.
2. **ECR** — image repository with scan-on-push and lifecycle rules.
3. **Secrets** — Secrets Manager entries + SSM parameters.
4. **Dns** — Route 53 hosted zone + ACM cert.
5. **Ecs** — ECS Fargate cluster, service, ALB, DNS.
6. **Cdn** — CloudFront distribution + S3 assets bucket.
7. **Monitoring** — CloudWatch alarms + dashboard.
8. **Iam** — OIDC provider + GitHub Actions role.

## Rollback
```bash
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $PREVIOUS_TASK_DEF_ARN
```
