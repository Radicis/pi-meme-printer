import * as AWS from 'aws-sdk';
import stream from 'stream';

const S3 = new AWS.S3();

export type S3Props = {
  Bucket: string;
  Key: string;
};

export type S3PutProps = {
  Bucket: string;
  Key: string;
  Body: any;
  ContentType: string;
};

export function getObject({ Bucket, Key }: S3Props) {
  return S3.getObject({ Bucket, Key }).promise();
}

export function putObject({ Bucket, Key, Body, ContentType }: S3PutProps) {
  return S3.putObject({ Bucket, Key, Body, ContentType }).promise();
}

export function readStream({ Bucket, Key }: S3Props) {
  return S3.getObject({ Bucket, Key }).createReadStream();
}

export function deleteById({ Bucket, Key }: S3Props) {
  return S3.deleteObjects({
    Bucket,
    Delete: { Objects: [{ Key }] }
  }).promise();
}

export function writeStream({ Bucket, Key }: S3Props) {
  const passThrough = new stream.PassThrough();
  return {
    writeStream: passThrough,
    uploaded: S3.upload({
      ContentType: 'image/jpeg',
      Body: passThrough,
      Bucket,
      Key
    }).promise()
  };
}
