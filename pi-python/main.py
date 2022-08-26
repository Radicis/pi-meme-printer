import os
from threading import Timer
from time import sleep
import boto3
import io
from Adafruit_Thermal import *
from PIL import Image
import cv2

CAMERA_BUCKET = 'meme-camera-pics'
PROCESSED_BUCKET = 'processed-memes'

print('Init printer on /dev/serial0')

printer = Adafruit_Thermal("/dev/serial0", 19200, timeout=3)
printer.setTimes(35000, 2100)
printer.begin(255)
print('Printer init success')

s3_client = boto3.client('s3')
dynamo_client = boto3.client('dynamodb')

has_paper = True

try:
  has_paper = printer.hasPaper()
except:
  print('Failed to check for paper, its probably not online')

class RepeatTimer(Timer):
  def run(self):
    while not self.finished.wait(self.interval):
      self.function(*self.args, **self.kwargs)


def take_pic(key, file_name):
  camera = cv2.VideoCapture(0)
  y=0
  x=100
  h=1080
  w=500
  cam_file_name = 'camera_' + file_name
  ret, image = camera.read()
  crop = image[y:y+h, x:x+w]
  cv2.imwrite(cam_file_name, crop)
  camera.release()
  cv2.destroyAllWindows()
  try:
    upload_camera_pic(key, cam_file_name)
  except:
    print('Failed to upload camera pic to s3')
  print('Removing camera file: ' + cam_file_name)
  os.remove(cam_file_name)


def upload_camera_pic(key, file_name):
  print('Uploading camera image')
  img = Image.open(file_name)
  img_byte_arr = io.BytesIO()
  img.save(img_byte_arr, format='JPEG')
  s3_client.put_object(Body=img_byte_arr.getvalue(), Bucket=CAMERA_BUCKET, Key=key)
  print('Uploading camera image completed')


def print_image(file_name):
  printer.wake()
  has_paper = True
  try:
    has_paper = printer.hasPaper()
    print('Printing: ' + file_name)
    img = Image.open(file_name)
    print('Beginning print..')
    printer.printImage(img)
    printer.feed(4)
    print('Printing completed')
    printer.sleep()
    return True
  except:
    print('Failed to check for paper, its probably not online')
    return False

def printer_status():
  dynamo_client.update_item(
    TableName='meme-printer-status',
    Key={
      'id': { 'S': 'printer' }
    },
    UpdateExpression="set printer=:r, paper=:p, updatedAt=:u",
    ExpressionAttributeValues={
      ':r': { 'BOOL': True },
      ':p': { 'BOOL': has_paper },
      ':u': { 'N': str(round(time.time() * 1000)) }
    }
  )


def process_files():
  printer_status()
  print('Checking for new images...')

  if(has_paper):
    response = s3_client.list_objects_v2(Bucket=PROCESSED_BUCKET)
    if 'Contents' in response:
      all = response['Contents']
      latest = max(all, key=lambda x: x['LastModified'])
      print('Got new image')
      latest_key = latest['Key']
      print(latest_key)
      image = s3_client.get_object(Bucket=PROCESSED_BUCKET, Key=latest_key)
      body = image['Body']
      body_bytes = body.read()
      pil_im = Image.open(io.BytesIO(body_bytes))
      print('Saving')
      file_name = latest_key + '.jpeg'
      print(file_name)
      pil_im.save(file_name)
      print('Saved to OS')
      printed = print_image(file_name)

      if(printed):
        take_pic(latest_key, file_name)
        print('Deleting from system')
        os.remove(file_name)
        print('Deleting from S3')
        s3_client.delete_object(Bucket=PROCESSED_BUCKET, Key=latest_key)
      sleep(2)
    else:
      print('No images')
  else:
    print('No paper :(')

def main():
  print('Timed Process Init')
  # run process_files every 10s
  RepeatTimer(10, process_files).start()


if __name__ == "__main__":
  main()
