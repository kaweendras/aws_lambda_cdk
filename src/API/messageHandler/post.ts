import * as AWS from 'aws-sdk'; // todo: check if this increases bundle size
import { Handler } from 'aws-lambda';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const dynamoDBTableName = process.env.MSG_TABLE_NAME || '';
const s3BucketName = process.env.S3_BUCKET_NAME || '';

export const handler: Handler = async (event) => {
  try {
    // Extract data from the API requestc
    const entireMsg = JSON.parse(event.body || '{}');
    const metadata = entireMsg.metadata;
    const data = entireMsg.data;
    if (!validateMetadata(metadata)) {
      console.log('⚠️ Invalid metadata');

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: '⚠️ Invalid metadata' }),
      };
    }
    const { message_time, company_id, message_id } = metadata;

    // Save to S3
    await saveToS3(s3BucketName, company_id, message_id, entireMsg);

    const key = `${company_id}/${message_id}.json`;

    // Update reference in DynamoDB
    const dynamoDBUpdateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: dynamoDBTableName,
      Key: {
        message_id: message_id,
      },
      ExpressionAttributeNames: {
        '#b': 'message',
      },
      ExpressionAttributeValues: {
        ':b': key,
      },
      UpdateExpression: 'SET #b = :b',
    };

    await dynamoDB.update(dynamoDBUpdateParams).promise();

    console.log('✅ Message data saved successfully.');
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: '✅ Message data saved successfully.',
        s3bucketRef: key,
      }),
    };
  } catch (error) {
    // Return error response
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: '🔴 Internal Server Error',
        error: error,
      }),
    };
  }
};

function validateMetadata(metadata: any): boolean {
  const requiredFields = ['message_time', 'company_id', 'message_id'];

  for (const field of requiredFields) {
    if (!metadata[field]) {
      return false;
    }
  }

  return true;
}

async function saveToS3(
  bucket: string,
  companyId: string,
  messageId: string,
  data: any,
) {
  const params = {
    Bucket: bucket,
    Key: `${companyId}/${messageId}.json`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  };

  return await s3.putObject(params).promise();
}
