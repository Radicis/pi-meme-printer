import { main } from './get';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

jest.mock('../../utils/dynamoDbClient');

const mockDynamoDocClient = dynamoDocClient as jest.MockedFn<
  typeof dynamoDocClient
>;

const baseTestEvent = {
  body: {},
  queryStringParameters: {},
  pathParameters: {},
  headers: {}
} as APIGatewayProxyEventV2;

const mockGet = jest.fn();

describe('Get Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      get: mockGet
    } as unknown as DocumentClient);
  });
  test('should get', async () => {
    mockGet.mockReturnValue({
      promise: () => ({
        Item: { test: true }
      })
    });
    const res = await main({ ...baseTestEvent, pathParameters: { id: '123' } });
    expect(mockGet).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: '123' }
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(JSON.stringify({ test: true }));
    }
  });
});
