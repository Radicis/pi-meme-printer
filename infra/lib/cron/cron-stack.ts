import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {
  aws_dynamodb,
  aws_events,
  aws_events_targets,
  Duration,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface CronStackProps extends cdk.StackProps {
  table: aws_dynamodb.Table;
}

export class CronStack extends Stack {
  constructor(scope: Construct, id: string, props: CronStackProps) {
    super(scope, id, props);

    // Runs a cleanup task -> delete all Dynamo Records that dont have a camera pic after each day (probably failed)
    const cleanupFn = new NodejsFunction(this, 'CleanupHandler', {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../../src/cron/cleanup.ts`),
      environment: {
        TABLE_NAME: props.table.tableName
      }
    });

    props.table.grantReadWriteData(cleanupFn);

    const eventRule = new aws_events.Rule(this, 'scheduleRule', {
      schedule: aws_events.Schedule.cron({ day: '1' })
    });
    eventRule.addTarget(new aws_events_targets.LambdaFunction(cleanupFn));
  }
}
