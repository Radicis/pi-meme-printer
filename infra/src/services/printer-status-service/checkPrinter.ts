import { APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../../utils/response';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import log from '../../utils/log';

const { TABLE_NAME = '' } = process.env;

const TIMEOUT_MS = 30000; // 30s

async function checkPrinter() {
  const item = (
    await dynamoDocClient()
      .get({
        TableName: TABLE_NAME,
        Key: { id: 'printer' }
      })
      .promise()
  ).Item;

  if (!item) {
    log.warn('NO printer status record found');
    return;
  }

  const currentDateTime = new Date().toISOString();

  const updateParams = {
    TableName: TABLE_NAME,
    Key: { id: 'monitor' },
    UpdateExpression: 'SET #printer = :r, #paper = :p, #updatedAt = :u',
    ExpressionAttributeValues: {
      ':r': Boolean(
        new Date(currentDateTime).getMilliseconds() -
          new Date(item.updatedAt).getMilliseconds() <
          TIMEOUT_MS
      ),
      ':p': item.paper,
      ':u': currentDateTime
    },
    ExpressionAttributeNames: {
      '#printer': 'printer',
      '#paper': 'paper',
      '#updatedAt': 'updatedAt'
    },
    ReturnValues: 'ALL_NEW'
  };

  return dynamoDocClient().update(updateParams).promise();
}

export async function main(): Promise<APIGatewayProxyResultV2> {
  return createResponse(checkPrinter(), {
    successCode: 204
  });
}
