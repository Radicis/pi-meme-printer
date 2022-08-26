import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway,
  aws_dynamodb,
  aws_events,
  aws_events_targets,
  Duration,
  RemovalPolicy,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import path from 'path';
import { IDomainName, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway/lib/restapi';

interface PrinterStatusStackProps extends cdk.StackProps {
  apiDomainName: aws_apigateway.DomainName;
}

export class PrinterStatusStack extends Stack {
  constructor(scope: Construct, id: string, props: PrinterStatusStackProps) {
    super(scope, id, props);

    const table = new aws_dynamodb.Table(this, 'StatusTable', {
      partitionKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
      tableName: 'meme-printer-status',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const printerStatusFn = new NodejsFunction(this, 'printerStatusFn', {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(
        __dirname,
        `/../../src/services/printer-status-service/checkPrinter.ts`
      ),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    table.grantReadWriteData(printerStatusFn);

    const printerStatusRule = new aws_events.Rule(this, 'printerStatusRule', {
      schedule: aws_events.Schedule.cron({ minute: '*' })
    });

    printerStatusRule.addTarget(
      new aws_events_targets.LambdaFunction(printerStatusFn)
    );

    const api = new aws_apigateway.RestApi(this, 'StatusApi', {});

    new aws_apigateway.BasePathMapping(this, 'BasePathMapping', {
      domainName: props.apiDomainName as IDomainName,
      restApi: api as IRestApi,
      basePath: 'status'
    }).applyRemovalPolicy(RemovalPolicy.DESTROY);

    const getStatusFn = new NodejsFunction(this, 'getStatusFn', {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(
        __dirname,
        `/../../src/services/printer-status-service/get.ts`
      ),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    table.grantReadData(getStatusFn);

    const getStatusIntegration = new LambdaIntegration(getStatusFn, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    api.root.addMethod('GET', getStatusIntegration);
  }
}
