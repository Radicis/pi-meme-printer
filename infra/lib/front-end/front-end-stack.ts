import * as cdk from 'aws-cdk-lib';
import {
  aws_certificatemanager,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_route53,
  aws_route53_targets,
  aws_s3,
  aws_s3_deployment,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';

interface FrontEndStackProps extends cdk.StackProps {
  domain: string;
  zone: aws_route53.IHostedZone;
  certificateArn: string;
}

/**
 * Deploys the front end site into an S3 bucket with a CF sit on top
 * NOTE: Build the front end with yarn build first so it generates the required files
 */
export class FrontEndStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontEndStackProps) {
    super(scope, id, props);

    const bucket = new aws_s3.Bucket(this, 'MemeFrontEndBucket', {
      bucketName: 'meme-front-end',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: aws_s3.BucketAccessControl.PRIVATE
    });

    // Make sure to run /front-end yarn build to generate these files before you deploy
    new aws_s3_deployment.BucketDeployment(this, 'DeployFiles', {
      sources: [aws_s3_deployment.Source.asset('../front-end/dist/')], // <-- Ensure this is built
      destinationBucket: bucket
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'OriginAccessIdentity'
    );

    bucket.grantRead(originAccessIdentity);

    const CFDIst = new aws_cloudfront.Distribution(
      this,
      'FrontEndDistribution',
      {
        defaultRootObject: 'index.html',
        domainNames: [props.domain, `www.${props.domain}`],
        // additionalBehaviors: {
        //   viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
        // },
        enabled: true,
        certificate: aws_certificatemanager.Certificate.fromCertificateArn(
          this,
          'CRCert',
          props.certificateArn
        ),
        defaultBehavior: {
          origin: new aws_cloudfront_origins.S3Origin(bucket, {
            originAccessIdentity
          })
        }
      }
    );

    new aws_route53.ARecord(this, 'FrontARecord', {
      recordName: props.domain,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(CFDIst)
      ),
      zone: props.zone as IHostedZone
    });

    new aws_route53.CnameRecord(this, 'FrontCnameRecord', {
      recordName: `www.${props.domain}`,
      domainName: 'props.domain',
      zone: props.zone as IHostedZone
    });
  }
}
