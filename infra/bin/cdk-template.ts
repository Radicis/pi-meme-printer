#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import dotenv from 'dotenv';
import { SharedStack } from '../lib/shared/shared-stack';
import { MemeApiStack } from '../lib/services/meme-api-stack';
import { FrontEndStack } from '../lib/front-end/front-end-stack';
import { PrinterStatusStack } from '../lib/services/printer-status-stack';
import { ImageEventHandlerStack } from '../lib/event-handlers/image-event-handler-stack';
import { CronStack } from '../lib/cron/cron-stack';

dotenv.config();

const app = new cdk.App();

const {
  CDK_DEFAULT_REGION,
  CDK_DEFAULT_ACCOUNT,
  DOMAIN = '',
  CLOUDFRONT_US_EAST_1_CERTIFICATE_ARN = '',
  DEFAULT_REGION_CERTIFICATE_ARN = ''
} = process.env;

const sharedStack = new SharedStack(app, 'SharedStack', {
  domain: DOMAIN,
  certificateArn: DEFAULT_REGION_CERTIFICATE_ARN,
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

new FrontEndStack(app, 'FrontEndStack', {
  domain: DOMAIN,
  zone: sharedStack.zone,
  certificateArn: CLOUDFRONT_US_EAST_1_CERTIFICATE_ARN,
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

new ImageEventHandlerStack(app, 'ImageEventHandlerStack', {
  cameraPicsBucketName: sharedStack.cameraPics.bucketName,
  processedBucket: sharedStack.processedBucket,
  table: sharedStack.table,
  rawBucketName: sharedStack.rawBucket.bucketName,
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

new CronStack(app, 'CronStack', {
  table: sharedStack.table,
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

new PrinterStatusStack(app, 'PrinterStatusStack', {
  apiDomainName: sharedStack.apiDomainName,
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

new MemeApiStack(app, 'MemeApiStack', {
  certificate: sharedStack.certificate,
  apiDomainName: sharedStack.apiDomainName,
  table: sharedStack.table,
  rawBucket: sharedStack.rawBucket,
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});
