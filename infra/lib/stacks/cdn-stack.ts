import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps {
  cfg: AppConfig;
  alb: elbv2.ApplicationLoadBalancer;
  hostedZone: route53.IHostedZone;
  certificate: acm.ICertificate;
}

export class CdnStack extends cdk.Stack {
  public readonly distribution: cf.Distribution;
  public readonly assetsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.assetsBucket = new s3.Bucket(this, 'Assets', {
      bucketName: `${props.cfg.appName}-${props.cfg.environment}-assets`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
        allowedOrigins: [`https://${props.cfg.domainName}`],
        allowedHeaders: ['*'],
      }],
    });

    this.distribution = new cf.Distribution(this, 'Cdn', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.alb, { protocolPolicy: cf.OriginProtocolPolicy.HTTPS_ONLY }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cf.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(props.alb, { protocolPolicy: cf.OriginProtocolPolicy.HTTPS_ONLY }),
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cf.CachePolicy.CACHING_DISABLED,
          allowedMethods: cf.AllowedMethods.ALLOW_ALL,
        },
        '/assets/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.assetsBucket),
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      priceClass: cf.PriceClass.PRICE_CLASS_100,
      certificate: props.certificate,
      domainNames: [props.cfg.domainName],
    });
  }
}
