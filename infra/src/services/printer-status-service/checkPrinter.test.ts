import { main } from './checkPrinter';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

jest.mock('../../utils/dynamoDbClient');

const mockDynamoDocClient = dynamoDocClient as jest.MockedFn<
  typeof dynamoDocClient
>;

const mockGet = jest.fn();
const mockUpdate = jest.fn();

describe('Check Printer Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDocClient.mockReturnValue({
      get: mockGet,
      update: mockUpdate
    } as unknown as DocumentClient);
  });
  test('should check printer', async () => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2022-08-26T13:00:17.674Z');

    mockGet.mockReturnValue({
      promise: () => ({
        Item: { updatedAt: '2022-08-26T13:00:16.674Z', paper: true }
      })
    });
    mockUpdate.mockReturnValue({
      promise: () => ({
        Item: { ok: true }
      })
    });
    const res = await main();
    expect(mockGet).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'printer' }
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'monitor' },
      UpdateExpression: 'SET #printer = :r, #paper = :p, #updatedAt = :u',
      ExpressionAttributeValues: {
        ':r': true,
        ':p': true,
        ':u': '2022-08-26T13:00:17.674Z'
      },
      ExpressionAttributeNames: {
        '#printer': 'printer',
        '#paper': 'paper',
        '#updatedAt': 'updatedAt'
      },
      ReturnValues: 'ALL_NEW'
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(204);
    }
  });
  test('should check printer and set to false', async () => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2022-08-26T13:00:17.674Z');

    mockGet.mockReturnValue({
      promise: () => ({
        Item: { updatedAt: '2022-08-26T13:00:46.674Z', paper: true }
      })
    });
    mockUpdate.mockReturnValue({
      promise: () => ({
        Item: { ok: true }
      })
    });
    const res = await main();
    expect(mockGet).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'printer' }
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      TableName: '',
      Key: { id: 'monitor' },
      UpdateExpression: 'SET #printer = :r, #paper = :p, #updatedAt = :u',
      ExpressionAttributeValues: {
        ':r': true,
        ':p': true,
        ':u': '2022-08-26T13:00:17.674Z'
      },
      ExpressionAttributeNames: {
        '#printer': 'printer',
        '#paper': 'paper',
        '#updatedAt': 'updatedAt'
      },
      ReturnValues: 'ALL_NEW'
    });
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(204);
    }
  });
});
