import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway,
  aws_certificatemanager,
  aws_dynamodb,
  aws_s3,
  Duration,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { ApiWithKeyAndBasePathMapping } from '../constructs/ApiWithBasePathMapping';

interface MemeApiStackProps extends cdk.StackProps {
  certificate: aws_certificatemanager.ICertificate;
  table: aws_dynamodb.Table;
  rawBucket: aws_s3.Bucket;
  apiDomainName: aws_apigateway.DomainName;
}

export class MemeApiStack extends Stack {
  constructor(scope: Construct, id: string, props: MemeApiStackProps) {
    super(scope, id, props);

    const apiWithKeyAndBasePathMapping = new ApiWithKeyAndBasePathMapping(
      this,
      'MemesApi',
      {
        useApiKey: true,
        basePath: 'memes',
        certificate: props.certificate,
        apiDomainName: props.apiDomainName,
        apiProps: {
          restApiName: 'Meme Printer Api',
          description: 'This service prints memes.',
          endpointConfiguration: {
            types: [aws_apigateway.EndpointType.EDGE]
          },
          apiKeySourceType: aws_apigateway.ApiKeySourceType.HEADER,
          defaultCorsPreflightOptions: {
            allowHeaders: ['Content-Type', 'X-Amz-Date', 'X-Api-Key'],
            allowMethods: ['OPTIONS', 'GET'],
            allowOrigins: ['*']
          }
        }
      }
    );

    const listLambda = new NodejsFunction(this, 'list-memes-lambda', {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../../src/services/memes-service/list.ts`),
      environment: {
        TABLE_NAME: props.table.tableName
      }
    });

    props.table.grantReadData(listLambda);

    const listIntegration = new LambdaIntegration(listLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    apiWithKeyAndBasePathMapping.api.root.addMethod('GET', listIntegration, {
      apiKeyRequired: true
    });

    const getLambda = new NodejsFunction(this, 'get-meme-lambda', {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../../src/services/memes-service/get.ts`),
      environment: {
        TABLE_NAME: props.table.tableName
      }
    });

    props.table.grantReadData(getLambda);

    const getLambdaIntegration = new LambdaIntegration(getLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    apiWithKeyAndBasePathMapping.api.root
      .addResource('{id}')
      .addMethod('GET', getLambdaIntegration, {
        apiKeyRequired: true
      });

    const createLambda = new NodejsFunction(this, 'create-meme-lambda', {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(
        __dirname,
        `/../../src/services/memes-service/create.ts`
      ),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.rawBucket.bucketName
      }
    });

    props.rawBucket.grantPut(createLambda);
    props.table.grantWriteData(createLambda);

    const createIntegration = new LambdaIntegration(createLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    apiWithKeyAndBasePathMapping.api.root.addMethod('POST', createIntegration, {
      apiKeyRequired: true
    });
  }
}
