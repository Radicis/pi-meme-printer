import { main } from './create';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { v4 } from 'uuid';
import { putObject } from '../../utils/s3';

jest.mock('../../utils/dynamoDbClient');
jest.mock('../../utils/s3');
jest.mock('uuid');

const mockUUID = v4 as jest.MockedFn<typeof v4>;
const mockPutObject = putObject as jest.MockedFn<typeof putObject>;

const mockDynamoDocClient = dynamoDocClient as jest.MockedFn<
  typeof dynamoDocClient
>;

const baseTestEvent = {
  body: {},
  queryStringParameters: {},
  pathParameters: {},
  headers: {}
} as APIGatewayProxyEventV2;

const mockPut = jest.fn();

describe('Get Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      put: mockPut
    } as unknown as DocumentClient);
  });
  test('should create', async () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('DATE');
    mockUUID.mockReturnValue('123');
    // @ts-ignore
    mockPutObject.mockResolvedValue({ ok: true });
    mockPut.mockReturnValue({
      promise: () => ({
        Item: { test: true }
      })
    });
    const res = await main({
      ...baseTestEvent,
      headers: {
        ['X-Forwarded-For']: 'IP',
        ['User-Agent']: 'AGENT'
      },
      body: JSON.stringify({
        name: 'name',
        image: 'base64',
        message: 'message'
      })
    });

    expect(mockPutObject).toHaveBeenCalledWith({
      Bucket: '',
      Key: '123',
      Body: Buffer.from('base64', 'base64'),
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    });

    expect(mockPut).toHaveBeenCalledWith({
      TableName: '',
      Item: {
        id: '123',
        name: 'name',
        text: 'message',
        createdAt: 'DATE',
        userIP: 'IP',
        userAgent: 'AGENT'
      }
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        JSON.stringify({
          id: '123',
          name: 'name',
          text: 'message',
          createdAt: 'DATE',
          userIP: 'IP',
          userAgent: 'AGENT'
        })
      );
    }
  });
});
