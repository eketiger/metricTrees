import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { AppConfig } from '../config';

interface Props extends cdk.StackProps { cfg: AppConfig; }

export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      hostedZoneId: props.cfg.hostedZoneId,
      zoneName: props.cfg.domainName,
    });
    this.certificate = new acm.Certificate(this, 'Cert', {
      domainName: props.cfg.domainName,
      subjectAlternativeNames: [`www.${props.cfg.domainName}`],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
