import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'; // Import DynamoDB module
import * as s3 from 'aws-cdk-lib/aws-s3';

interface IProps {
  msgRestAPI: apiGw.RestApi;
}

/**
 * Creates business profile API GW resource, get and post lambdas for the resource
 */
export class MessageContruct extends Construct {
  public readonly postMsgLamdaAlias: lambda.Alias;
  public readonly getMsgLambdaAlias: lambda.Alias;
  public readonly msgTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);
    const { msgRestAPI } = props;

    const removalPolicy = cdk.RemovalPolicy.DESTROY;

    // Create DynamoDB table for coperate users
    this.msgTable = new dynamodb.Table(this, 'MsgTable', {
      partitionKey: { name: 'message_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: removalPolicy, // Specify removal policy as needed
      billingMode: dynamodb.BillingMode.PROVISIONED, // You can choose PROVISIONED if needed
    });

    // Create S3 bucket for storing documents. encrypted by default
    const s3Bucket = new s3.Bucket(this, 'message-bucket', {
      removalPolicy: removalPolicy,
    });

    const messageHandlerLambdaBaseEntry = 'src/API/messageHandler';

    // Biz register Lambda function
    const postLambda = new NodejsFunction(this, 'post-lambda-msg', {
      functionName: `post-lambda-msg`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: `${messageHandlerLambdaBaseEntry}/post.ts`,
      timeout: cdk.Duration.seconds(25),
      memorySize: 256,
      bundling: {
        minify: true,
      },
      environment: {
        MSG_TABLE_NAME: this.msgTable.tableName,
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
    });

    // create an alias for the version
    this.postMsgLamdaAlias = new lambda.Alias(this, 'post-lambda-msg-alias', {
      aliasName: 'current',
      version: postLambda.currentVersion,
    });

    // business-profile route
    const apiGwResource = msgRestAPI.root.addResource('msg');
    const postMsgLambdaIntegration = new apiGw.LambdaIntegration(
      this.postMsgLamdaAlias,
    );
    apiGwResource.addMethod('POST', postMsgLambdaIntegration, {
      authorizationType: apiGw.AuthorizationType.NONE,
    });

    // Biz Profile GET Lambda function
    const getLambda = new NodejsFunction(this, 'get-msg-lambda', {
      functionName: `get-msg-lambda`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: `${messageHandlerLambdaBaseEntry}/get.ts`,
      timeout: cdk.Duration.seconds(25),
      memorySize: 256,
      bundling: {
        minify: true,
      },
      environment: {
        MSG_TABLE_NAME: this.msgTable.tableName,
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
    });

    this.getMsgLambdaAlias = new lambda.Alias(this, 'get-msg-lambda-alias', {
      aliasName: 'current',
      version: getLambda.currentVersion,
    });

    const getMsgIntegration = new apiGw.LambdaIntegration(
      this.getMsgLambdaAlias,
    );

    apiGwResource.addMethod('GET', getMsgIntegration, {
      authorizationType: apiGw.AuthorizationType.NONE,
    });
  }
}
