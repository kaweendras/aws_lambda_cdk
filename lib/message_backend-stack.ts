import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MessageContruct } from './constructs/message-construct';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
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
