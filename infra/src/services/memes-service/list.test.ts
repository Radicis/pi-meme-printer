import { main } from './list';
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

const mockScan = jest.fn();

describe('List Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      scan: mockScan
    } as unknown as DocumentClient);
  });
  test('should list with default params', async () => {
    mockScan.mockReturnValue({
      promise: () => ({
        Count: 10,
        Items: [],
        LastEvaluatedKey: 123
      })
    });
    const res = await main(baseTestEvent);
    expect(mockScan).toHaveBeenCalledWith({
      TableName: '',
      IndexName: 'createdAtIdx',
      ScanIndexForward: false,
      Limit: 10
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        JSON.stringify({
          total: 10,
          items: [],
          lastKey: 123
        })
      );
    }
  });
  test('should list but with pagination params', async () => {
    mockScan.mockReturnValue({
      promise: () => ({
        Count: 10,
        Items: [],
        LastEvaluatedKey: 123
      })
    });
    const res = await main({
      ...baseTestEvent,
      queryStringParameters: {
        limit: '5',
        lastEvaluatedId: '123',
        lastEvaluatedCreatedAt: '321'
      }
    });
    expect(mockScan).toHaveBeenCalledWith({
      TableName: '',
      IndexName: 'createdAtIdx',
      ScanIndexForward: false,
      Limit: 5,
      ExclusiveStartKey: {
        id: '123',
        createdAt: '321'
      }
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        JSON.stringify({
          total: 10,
          items: [],
          lastKey: 123
        })
      );
    }
  });
});
