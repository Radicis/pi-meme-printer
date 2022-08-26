import { APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../utils/response';
import { dynamoDocClient } from '../utils/dynamoDbClient';
import log from '../utils/log';

const { TABLE_NAME = '' } = process.env;

/**
 * Runs a cleanup task -> delete all Dynamo Records that dont have a camera pic after each day (probably failed)
 */
async function cleanup() {
  // Get all keys in Dynamo which DONT have a camera pic yet (probably old)
  const results = (
    await dynamoDocClient()
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_not_exists(camera64)'
      })
      .promise()
  ).Items;

  if (!results || !results.length) {
    return;
  }

  log.info(results, 'Found some items to delete..');

  const deleteParams = {
    RequestItems: {
      [TABLE_NAME]: results.map((res) => ({
        DeleteRequest: {
          Key: { id: res.id }
        }
      }))
    }
  };

  return dynamoDocClient().batchWrite(deleteParams).promise();
}

export async function main(): Promise<APIGatewayProxyResultV2> {
  return createResponse(cleanup(), {
    successCode: 204
  });
}
