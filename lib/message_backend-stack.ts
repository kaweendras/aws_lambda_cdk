import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MessageContruct } from './constructs/message-construct';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { env } from 'process';
import * as dotenv from 'dotenv';
dotenv.config();

export class MessageBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const msgRestAPI = new apiGw.RestApi(this, 'msgRestAPI', {
      // todo: enable WAF
      restApiName: `restAPI_msg_sender`,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGw.Cors.ALL_ORIGINS,
        allowMethods: apiGw.Cors.ALL_METHODS,
      },
      //* You need to manually create an IAM role for each AWS account per region to grant cloudwatch logs write permissions to all APIs.
      // deployOptions: {
      //   accessLogDestination: new apiGw.LogGroupLogDestination(logGroup),
      //   accessLogFormat: apiGw.AccessLogFormat.custom(
      //     `{"requestedTime":"${apiGw.AccessLogField.contextRequestTime()}","requestId":"${
      //       apiGw.AccessLogField.contextRequestId
      //     }","httpMethod":"${
      //       apiGw.AccessLogField.contextHttpMethod
      //     }","path":"$context.path","resourcePath":"$context.resourcePath","status":$context.status,"responseLatency":$context.responseLatency}`,
      //   ),
      // },
    });

    // business profile API GW resource, get and post lambdas for the resource
    const messageContruct = new MessageContruct(this, 'message-construct', {
      msgRestAPI,
    });

    // grant read write  access to business profile lambda function
    messageContruct.msgTable.grantReadWriteData(
      messageContruct.postMsgLamdaAlias,
    );

    messageContruct.msgTable.grantReadWriteData(
      messageContruct.getMsgLambdaAlias,
    );

    new cdk.CfnOutput(this, 'BackendAPIRootURL', {
      value:
        env.ENVIRONMENT === 'prod'
          ? 'https://api.MSGSENDER.com'
          : msgRestAPI.url,
    });
    cdk.Tags.of(messageContruct).add('construct', 'message-construct');
  }
}
