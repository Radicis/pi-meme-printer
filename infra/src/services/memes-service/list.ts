import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../../utils/response';
import { processEvent } from '../../utils/event-utils';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import { QueryInput } from 'aws-sdk/clients/dynamodb';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import AttributeValue = DocumentClient.AttributeValue;

const { TABLE_NAME = '' } = process.env;

const MAX_LIMIT = 100;

type PaginationParams = {
  limit: string;
  lastEvaluatedId?: string;
  lastEvaluatedCreatedAt?: string;
};

async function list({
  limit = '10',
  lastEvaluatedId,
  lastEvaluatedCreatedAt
}: PaginationParams) {
  const queryParams: QueryInput = {
    TableName: TABLE_NAME,
    IndexName: 'createdAtIdx',
    ScanIndexForward: false,
    Limit: parseInt(limit, 10) > MAX_LIMIT ? MAX_LIMIT : parseInt(limit, 10)
  };
  if (lastEvaluatedId && lastEvaluatedCreatedAt) {
    queryParams.ExclusiveStartKey = {
      id: lastEvaluatedId as AttributeValue,
      createdAt: lastEvaluatedCreatedAt as AttributeValue
    };
  }
  const {
    Count: total,
    Items: items,
    LastEvaluatedKey: lastKey
  } = await dynamoDocClient().scan(queryParams).promise();
  return {
    total,
    items,
    lastKey
  };
}

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const { queryStringParameters = {} } = processEvent(event);
  const { limit, lastEvaluatedId, lastEvaluatedCreatedAt } =
    queryStringParameters as unknown as PaginationParams;
  return createResponse(
    list({ limit, lastEvaluatedId, lastEvaluatedCreatedAt }),
    {
      successCode: 200
    }
  );
}
