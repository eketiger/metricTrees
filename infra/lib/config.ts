export type Environment = 'staging' | 'production';

export interface AppConfig {
  appName: string;
  environment: Environment;
  domainName: string;
  hostedZoneId: string;
  awsRegion: string;
  awsAccountId: string;
  taskCpu: number;
  taskMemoryMiB: number;
  desiredCount: number;
  natGateways: number;
  alarmEmail: string;
  githubOrg: string;
}

const staging: AppConfig = {
  appName: 'metrics',
  environment: 'staging',
  domainName: 'staging.yourdomain.com',
  hostedZoneId: 'Z00000000STAGING',
  awsRegion: 'us-east-1',
  awsAccountId: '000000000000',
  taskCpu: 512,
  taskMemoryMiB: 1024,
  desiredCount: 1,
  natGateways: 1,
  alarmEmail: 'alerts-staging@yourdomain.com',
  githubOrg: 'your-org',
};

const production: AppConfig = {
  ...staging,
  environment: 'production',
  domainName: 'yourdomain.com',
  hostedZoneId: 'Z00000000PRODUCTION',
  taskCpu: 1024,
  taskMemoryMiB: 2048,
  desiredCount: 2,
  natGateways: 2,
  alarmEmail: 'alerts@yourdomain.com',
};

export function configFor(env: Environment): AppConfig {
  return env === 'production' ? production : staging;
}
