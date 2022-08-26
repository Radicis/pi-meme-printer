import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway,
  aws_certificatemanager,
  aws_dynamodb,
  aws_route53,
  aws_s3,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DomainNameProps } from 'aws-cdk-lib/aws-apigateway';

interface DomainStackProps extends cdk.StackProps {
  domain: string;
  certificateArn: string;
}

/**
 * Creates the shared resources used by other stacks, hosted  zone, cert, buckets, dynamo table
 */
export class SharedStack extends Stack {
  public readonly table: aws_dynamodb.Table;
  public readonly certificate: aws_certificatemanager.ICertificate;
  public readonly processedBucket: aws_s3.Bucket;
  public readonly cameraPics: aws_s3.Bucket;
  public readonly rawBucket: aws_s3.Bucket;
  public readonly apiDomainName: aws_apigateway.DomainName;
  public readonly zone: aws_route53.HostedZone;

  constructor(scope: Construct, id: string, props: DomainStackProps) {
    super(scope, id, props);

    this.rawBucket = new aws_s3.Bucket(this, 'RawMemeBucket', {
      bucketName: 'raw-memes',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: false,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(1), enabled: true }]
    });

    this.processedBucket = new aws_s3.Bucket(this, 'ProcessedMemeBucket', {
      bucketName: 'processed-memes',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: false,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(1), enabled: true }]
    });

    this.cameraPics = new aws_s3.Bucket(this, 'MemeCameraBucket', {
      bucketName: 'meme-camera-pics',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: false,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(1), enabled: true }]
    });

    this.table = new aws_dynamodb.Table(this, 'MemeTable', {
      partitionKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST
    });

    this.table.addGlobalSecondaryIndex({
      partitionKey: {
        name: 'id',
        type: aws_dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: aws_dynamodb.AttributeType.STRING
      },
      indexName: 'createdAtIdx',
      projectionType: aws_dynamodb.ProjectionType.ALL
    });

    this.certificate = aws_certificatemanager.Certificate.fromCertificateArn(
      this,
      'MemeAPICertificate',
      props.certificateArn
    );

    this.zone = new aws_route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domain
    });

    this.apiDomainName = new aws_apigateway.DomainName(
      this,
      'api-domain-name',
      {
        domainName: `api.${props.domain}`,
        certificate: this.certificate as aws_certificatemanager.ICertificate
      } as DomainNameProps
    );

    // FIXME: this fails for some reason
    // new aws_route53.ARecord(this, 'ApiARecord', {
    //   target: aws_route53.RecordTarget.fromAlias(
    //     new aws_route53_targets.ApiGatewayv2DomainProperties(
    //       `api.${props.domain}`,
    //       this.zone.hostedZoneId
    //     )
    //   ),
    //   zone: this.zone as IHostedZone,
    //   comment: 'Api Mapping',
    //   recordName: `api.${props.domain}`
    // });
  }
}
