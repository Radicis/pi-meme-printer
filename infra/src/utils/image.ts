import { getObject, readStream, S3Props, writeStream } from './s3';
import sharp from 'sharp';
import { NotFound } from './errors';

const { OUTPUT_BUCKET_NAME = '' } = process.env;

export async function processImageAndBase64(
  bucketName: string,
  key: string
): Promise<string> {
  const inputS3Props: S3Props = {
    Bucket: bucketName,
    Key: key
  };

  const streamResize = sharp()
    .resize({
      width: 384,
      height: 435,
      fit: 'inside',
      background: '#ffffff'
    })
    .toFormat('jpeg');

  const rs = readStream(inputS3Props);

  const { writeStream: ws, uploaded } = writeStream({
    Bucket: OUTPUT_BUCKET_NAME,
    Key: key
  });

  rs.pipe(streamResize).pipe(ws);

  await uploaded;

  const newImg = await getObject({ Bucket: OUTPUT_BUCKET_NAME, Key: key });

  if (!newImg?.Body) {
    throw new NotFound('No image data found in s3 after upload');
  }

  return newImg.Body.toString('base64');
}
