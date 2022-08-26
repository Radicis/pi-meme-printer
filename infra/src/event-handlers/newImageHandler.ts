import createResponse from '../utils/response';
import { processS3Event } from '../utils/event-utils';
import log from '../utils/log';
import { dynamoDocClient } from '../utils/dynamoDbClient';
import { deleteById } from '../utils/s3';
import { processImageAndBase64 } from '../utils/image';
import { APIGatewayProxyResultV2, S3Event } from 'aws-lambda';

const { TABLE_NAME = '' } = process.env;

async function processAndStore({
  bucketName,
  key
}: {
  bucketName: string;
  key: string;
}) {
  try {
    const base64 = await processImageAndBase64(bucketName, key);

    const updateQueryParams = {
      TableName: TABLE_NAME,
      Key: { id: key },
      UpdateExpression: 'SET #base64 = :base64',
      ExpressionAttributeValues: {
        ':base64': base64
      },
      ExpressionAttributeNames: {
        '#base64': 'base64'
      },
      ReturnValues: 'ALL_NEW'
    };
    // Store the record in dynamo with the base64 string
    await dynamoDocClient().update(updateQueryParams).promise();
  } catch (e) {
    log.error(e);
  } finally {
    // Clean up the source image
    await deleteById({ Bucket: bucketName, Key: key });
  }
}

export async function main(event: S3Event): Promise<APIGatewayProxyResultV2> {
  const { body } = processS3Event(event);
  return createResponse(processAndStore(body), {
    successCode: 201
  });
}
