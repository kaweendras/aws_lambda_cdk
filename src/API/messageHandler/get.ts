import * as AWS from 'aws-sdk'; // todo: check if this increases bundle size
import { Handler } from 'aws-lambda';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const dynamoDBTableName = process.env.MSG_TABLE_NAME || '';
const s3BucketName = process.env.S3_BUCKET_NAME || '';

export const handler: Handler = async (event) => {
  //get message_id from event params
  const message_id = event.pathParameters?.message_id;
  // Return error response if message_id is not provided
  if (!message_id) {
    console.error('🔴 Message ID is required');
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: '🔴 Message ID is required' }),
    };
  }

  try {
    const dynamoDBQueryParams: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: dynamoDBTableName,
      KeyConditionExpression: 'message_id = :message_id',
      ExpressionAttributeValues: {
        ':message_id': message_id,
      },
    };
    const result = await dynamoDB.query(dynamoDBQueryParams).promise();

    //get message from result
    const messagePath = result.Items?.[0]?.message;

    //from s3 bucket get the json file using messagePath
    const s3GetParams: AWS.S3.Types.GetObjectRequest = {
      Bucket: s3BucketName,
      Key: messagePath,
    };
    const s3Result = await s3.getObject(s3GetParams).promise();

    // check if the s3Result is empty
    if (!s3Result.Body) {
      console.error('🔴 Message not found');
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: '🔴 Message not found' }),
      };
    } else {
      console.log('✅ Message found');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: '✅ Message found',
          data: s3Result.Body.toString(),
        }),
      };
    }
  } catch (error) {
    // Return error response
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: '🔴 Internal Server Error', data: '' }),
    };
  }
};
