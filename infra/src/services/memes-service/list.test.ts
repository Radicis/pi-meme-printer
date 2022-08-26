import { main } from './list';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

const testEvent = {};

describe('List Tests', () => {
  test('should list', async () => {
    const res = await main(<APIGatewayProxyEventV2>testEvent);
    expect(typeof res).toEqual('object');
    if (typeof res === 'object') {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(JSON.stringify({ test: 'ok' }));
    }
  });
});
