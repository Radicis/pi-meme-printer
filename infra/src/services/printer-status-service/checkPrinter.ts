import { APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../../utils/response';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import log from '../../utils/log';

const { TABLE_NAME = '' } = process.env;

const TIMEOUT = 30000;

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

  log.info(
    `Checking last log time with ${Date.now()} and ${item.updatedAt}  ${
      Date.now() - item.updatedAt
    } with timeout: ${TIMEOUT}`
  );

  const updateParams = {
    TableName: TABLE_NAME,
    Key: { id: 'monitor' },
    UpdateExpression: 'SET #printer = :r, #paper = :p, #updatedAt = :u',
    ExpressionAttributeValues: {
      ':r': Boolean(Date.now() - item.updatedAt < TIMEOUT),
      ':p': item.paper,
      ':u': Date.now()
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
    successCode: 201
  });
}
