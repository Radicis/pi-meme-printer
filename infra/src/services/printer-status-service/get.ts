import { APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../../utils/response';
import { dynamoDocClient } from '../../utils/dynamoDbClient';

const { TABLE_NAME = '' } = process.env;

async function get() {
  return (
    await dynamoDocClient()
      .get({
        TableName: TABLE_NAME,
        Key: { id: 'monitor' }
      })
      .promise()
  ).Item;
}

export async function main(): Promise<APIGatewayProxyResultV2> {
  return createResponse(get(), {
    successCode: 200
  });
}
