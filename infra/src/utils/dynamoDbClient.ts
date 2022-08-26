import * as AWS from 'aws-sdk';

const { CDK_DEFAULT_REGION } = process.env;

const defaultOptions = {
  convertEmptyValues: true, // If this is not set, empty strings cause an error. This converts them automatically to NULL,
  region: CDK_DEFAULT_REGION,
  endpoint: process.env.LOCALSTACK_HOSTNAME
    ? `https://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT_URL
};

export function dynamoDocClient() {
  return new AWS.DynamoDB.DocumentClient(defaultOptions);
}
