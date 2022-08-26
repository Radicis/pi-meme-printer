import { main } from './newCameraImageHandler';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { dynamoDocClient } from '../utils/dynamoDbClient';
import { S3Event } from 'aws-lambda';
import { deleteById, getObject } from '../utils/s3';

jest.mock('../utils/dynamoDbClient');
jest.mock('../utils/s3');

const baseS3TestEvent = {
  Records: [
    {
      s3: {
        bucket: {
          name: 'BUCKET'
        },
        object: { key: 'OBJECT' }
      }
    }
  ]
} as S3Event;

const mockDynamoDocClient = dynamoDocClient as jest.MockedFn<
  typeof dynamoDocClient
>;
const mockDeleteById = deleteById as jest.MockedFn<typeof deleteById>;

const mockGetObject = getObject as jest.MockedFn<typeof getObject>;

const mockUpdate = jest.fn();

describe('New Camera Image Handler Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      update: mockUpdate
    } as unknown as DocumentClient);
  });
  test('should process a new camera image', async () => {
    mockUpdate.mockReturnValue({
      promise: () => ({
        Items: [{ id: '123' }]
      })
    });
    // @ts-ignore
    mockGetObject.mockResolvedValue({
      Body: 'BASE_64'
    });
    mockDeleteById.mockResolvedValue({
      // @ts-ignore
      ok: true
    });
    const res = await main(baseS3TestEvent);
    expect(mockDeleteById).toHaveBeenCalledWith({
      Bucket: 'BUCKET',
      Key: 'OBJECT'
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'OBJECT' },
      UpdateExpression: 'SET #camera64 = :camera64',
      ExpressionAttributeValues: {
        ':camera64': 'BASE_64'
      },
      ExpressionAttributeNames: {
        '#camera64': 'camera64'
      },
      ReturnValues: 'ALL_NEW'
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(JSON.stringify({}));
    }
  });
  test('should still delete if the update fails', async () => {
    mockUpdate.mockRejectedValue({
      promise: () => 'sad'
    });
    // @ts-ignore
    mockGetObject.mockResolvedValue({
      Body: 'BASE_64'
    });
    mockDeleteById.mockResolvedValue({
      // @ts-ignore
      ok: true
    });
    const res = await main(baseS3TestEvent);
    expect(mockDeleteById).toHaveBeenCalledWith({
      Bucket: 'BUCKET',
      Key: 'OBJECT'
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'OBJECT' },
      UpdateExpression: 'SET #camera64 = :camera64',
      ExpressionAttributeValues: {
        ':camera64': 'BASE_64'
      },
      ExpressionAttributeNames: {
        '#camera64': 'camera64'
      },
      ReturnValues: 'ALL_NEW'
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(JSON.stringify({}));
    }
  });
});
