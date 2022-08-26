import { main } from './cleanup';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { dynamoDocClient } from '../utils/dynamoDbClient';

jest.mock('../utils/dynamoDbClient');

const mockDynamoDocClient = dynamoDocClient as jest.MockedFn<
  typeof dynamoDocClient
>;

const mockScan = jest.fn();
const mockBatchWrite = jest.fn();

describe('Cleanup Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      scan: mockScan,
      batchWrite: mockBatchWrite
    } as unknown as DocumentClient);
  });
  test('should cleanup', async () => {
    mockScan.mockReturnValue({
      promise: () => ({
        Items: [{ id: '123' }, { id: '321' }]
      })
    });
    mockBatchWrite.mockReturnValue({
      promise: () => ({
        Items: [{ id: '123' }, { id: '321' }]
      })
    });
    const res = await main();
    expect(mockScan).toHaveBeenCalledWith({
      TableName: '',
      FilterExpression: 'attribute_not_exists(camera64)'
    });
    expect(mockBatchWrite).toHaveBeenCalledWith({
      RequestItems: {
        ['']: [
          {
            DeleteRequest: {
              Key: { id: '123' }
            }
          },
          {
            DeleteRequest: {
              Key: { id: '321' }
            }
          }
        ]
      }
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual(
        JSON.stringify({
          Items: [{ id: '123' }, { id: '321' }]
        })
      );
    }
  });
  test('should not cleanup when it gets not scan results', async () => {
    mockScan.mockReturnValue({
      promise: () => ({
        Items: []
      })
    });
    const res = await main();
    expect(mockScan).toHaveBeenCalledWith({
      TableName: '',
      FilterExpression: 'attribute_not_exists(camera64)'
    });
    expect(mockBatchWrite).not.toHaveBeenCalled();
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual('{}');
    }
  });
});
