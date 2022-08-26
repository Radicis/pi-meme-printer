import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../../utils/response';
import { processEvent } from '../../utils/event-utils';
import { dynamoDocClient } from '../../utils/dynamoDbClient';

const { TABLE_NAME = '' } = process.env;

async function get(id: string) {
  return (
    await dynamoDocClient()
      .get({
        TableName: TABLE_NAME,
        Key: { id }
      })
      .promise()
  ).Item;
}

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const { pathParameters } = processEvent(event);
  const { id } = pathParameters as { id: string };
  return createResponse(get(id), {
    successCode: 200
  });
}
