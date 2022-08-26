import log from './log';
import { GeneralError } from './errors';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
};

export default async function createResponse(
  promise: any,
  options?: { successCode: number }
) {
  const successCode = (options && options.successCode) || 200;
  try {
    const result = await promise;
    return {
      statusCode: successCode,
      body: JSON.stringify(result || {}),
      headers
    };
  } catch (err) {
    if (err instanceof GeneralError) {
      return {
        statusCode: err.getCode() || 500,
        body: JSON.stringify({
          code: err.getCode() || 500,
          err: err.message
        }),
        headers
      };
    } else {
      log.error({ err }, 'Request implementation failed');
      return {
        statusCode: 500,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        body: JSON.stringify({ err: err.toString() }),
        headers
      };
    }
  }
}
