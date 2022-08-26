import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {
  aws_dynamodb,
  aws_s3,
  aws_s3_notifications,
  Duration,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface ImageEventHandlerStackProps extends cdk.StackProps {
  rawBucketName: string;
  cameraPicsBucketName: string;
  table: aws_dynamodb.Table;
  processedBucket: aws_s3.Bucket;
}

export class ImageEventHandlerStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ImageEventHandlerStackProps
  ) {
    super(scope, id, props);
    // Passing in the bucket its self from props creates a cyclic reference with shared stack
    // https://github.com/aws/aws-cdk/issues/11245#issuecomment-1030597769
    const rawBucket = Bucket.fromBucketName(
      this,
      'RawBucket',
      props.rawBucketName
    );

    // Passing in the bucket its self from props creates a cyclic reference with shared stack
    // https://github.com/aws/aws-cdk/issues/11245#issuecomment-1030597769
    const cameraPicsBucket = Bucket.fromBucketName(
      this,
      'CameraPicsBucket',
      props.cameraPicsBucketName
    );

    const newImageFn = new NodejsFunction(this, 'NewImageHandler', {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      bundling: {
        nodeModules: ['sharp']
      },
      entry: path.join(
        __dirname,
        `/../../src/event-handlers/newImageHandler.ts`
      ),
      environment: {
        TABLE_NAME: props.table.tableName,
        OUTPUT_BUCKET_NAME: props.processedBucket.bucketName
      }
    });

    props.table.grantWriteData(newImageFn);
    rawBucket.grantReadWrite(newImageFn);
    props.processedBucket.grantRead(newImageFn);
    props.processedBucket.grantWrite(newImageFn);

    rawBucket.addEventNotification(
      aws_s3.EventType.OBJECT_CREATED,
      new aws_s3_notifications.LambdaDestination(newImageFn)
    );

    const newCameraImageFn = new NodejsFunction(this, 'NewCameraImageHandler', {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(
        __dirname,
        `/../../src/event-handlers/newCameraImageHandler.ts`
      ),
      environment: {
        TABLE_NAME: props.table.tableName
      }
    });

    props.table.grantWriteData(newCameraImageFn);
    cameraPicsBucket.grantReadWrite(newCameraImageFn);

    cameraPicsBucket.addEventNotification(
      aws_s3.EventType.OBJECT_CREATED,
      new aws_s3_notifications.LambdaDestination(newCameraImageFn)
    );
  }
}
