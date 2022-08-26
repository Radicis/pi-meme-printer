import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import createResponse from '../../utils/response';
import { processEvent } from '../../utils/event-utils';
import { putObject } from '../../utils/s3';
import { dynamoDocClient } from '../../utils/dynamoDbClient';
import { v4 as uuid } from 'uuid';

const { TABLE_NAME = '', BUCKET_NAME = '' } = process.env;

async function create({
  name,
  userIP,
  userAgent,
  image,
  message
}: {
  name: string;
  userIP: string;
  userAgent: string;
  image: string;
  message: string;
}) {
  const key = uuid();

  const imgBuffer = Buffer.from(image, 'base64');

  const s3PutParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imgBuffer,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  };

  await putObject(s3PutParams);

  const newItem = {
    id: key,
    name,
    text: message ? message.substring(0, 200) : '', // limit to 200 chars
    createdAt: new Date().toUTCString(),
    userIP,
    userAgent
  };

  const putQueryParams = {
    TableName: TABLE_NAME,
    Item: newItem
  };

  // Store the record in dynamo with the base64 string
  await dynamoDocClient().put(putQueryParams).promise();
  return newItem;
}

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const { body = {}, userIP, userAgent } = processEvent(event);
  const { name, image, message } = body;
  return createResponse(create({ name, image, message, userIP, userAgent }), {
    successCode: 200
  });
}
