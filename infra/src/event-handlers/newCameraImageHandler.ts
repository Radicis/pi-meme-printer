import { APIGatewayProxyResultV2, S3Event } from 'aws-lambda';
import createResponse from '../utils/response';
import { processS3Event } from '../utils/event-utils';
import log from '../utils/log';
import { dynamoDocClient } from '../utils/dynamoDbClient';
import { deleteById, getObject } from '../utils/s3';

const { TABLE_NAME = '' } = process.env;

async function processAndStore({
  bucketName,
  key
}: {
  bucketName: string;
  key: string;
}) {
  const s3Params = { Bucket: bucketName, Key: key };
  const image = await getObject(s3Params);
  const camera64 = image.Body?.toString('base64');

  const updateQueryParams = {
    TableName: TABLE_NAME,
    Key: { id: key },
    UpdateExpression: 'SET #camera64 = :camera64',
    ExpressionAttributeValues: {
      ':camera64': camera64
    },
    ExpressionAttributeNames: {
      '#camera64': 'camera64'
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    await dynamoDocClient().update(updateQueryParams).promise();
  } catch (e) {
    log.error(e);
  } finally {
    // Clean up the source image
    await deleteById(s3Params);
  }
}

export async function main(event: S3Event): Promise<APIGatewayProxyResultV2> {
  const { body } = processS3Event(event);
  return createResponse(processAndStore(body), {
    successCode: 201
  });
}
