import log from './log';
import { APIGatewayProxyEventV2, S3Event } from 'aws-lambda';

export function processEvent(event: APIGatewayProxyEventV2) {
  const {
    requestContext,
    body,
    queryStringParameters,
    pathParameters,
    headers
  } = event;
  const { requestId } = requestContext;
  log.info({ requestId, headers }, `Event received`);

  // "X-Forwarded-For": "78.18.219.157",
  const userIP = headers['X-Forwarded-For'] || 'unknown';
  // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0",
  const userAgent = headers['User-Agent'] || 'unknown';

  return {
    body: typeof body === 'string' ? JSON.parse(body) : body,
    queryStringParameters,
    pathParameters,
    userIP,
    userAgent
  };
}

export function processS3Event(event: S3Event) {
  const { Records } = event;
  const { s3 } = Records[0];
  const { bucket, object } = s3;
  const { name: bucketName } = bucket;
  const { key } = object;
  log.info({ bucketName, key }, `S3 Event received`);

  return {
    body: { bucketName, key }
  };
}
