import { main } from './newImageHandler';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { dynamoDocClient } from '../utils/dynamoDbClient';
import { S3Event } from 'aws-lambda';
import { processImageAndBase64 } from '../utils/image';
import { deleteById } from '../utils/s3';

jest.mock('../utils/dynamoDbClient');
jest.mock('../utils/image');
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

const mockProcessImageAndBase64 = processImageAndBase64 as jest.MockedFn<
  typeof processImageAndBase64
>;

const mockUpdate = jest.fn();

describe('New Image Handler Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      update: mockUpdate
    } as unknown as DocumentClient);
  });
  test('should process a new image', async () => {
    mockUpdate.mockReturnValue({
      promise: () => ({
        Items: [{ id: '123' }, { id: '321' }]
      })
    });
    mockProcessImageAndBase64.mockResolvedValue('BASE_64');

    mockDeleteById.mockResolvedValue({
      // @ts-ignore
      ok: true
    });
    const res = await main(baseS3TestEvent);
    expect(mockProcessImageAndBase64).toHaveBeenCalledWith('BUCKET', 'OBJECT');
    expect(mockUpdate).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'OBJECT' },
      UpdateExpression: 'SET #base64 = :base64',
      ExpressionAttributeValues: {
        ':base64': 'BASE_64'
      },
      ExpressionAttributeNames: {
        '#base64': 'base64'
      },
      ReturnValues: 'ALL_NEW'
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(JSON.stringify({}));
    }
  });
  test('should still remove the image if processing fails', async () => {
    mockProcessImageAndBase64.mockRejectedValue('Sad');
    mockDeleteById.mockResolvedValue({
      // @ts-ignore
      ok: true
    });
    const res = await main(baseS3TestEvent);
    expect(mockProcessImageAndBase64).toHaveBeenCalledWith('BUCKET', 'OBJECT');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(JSON.stringify({}));
    }
  });
});
