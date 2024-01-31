#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MessageBackendStack } from '../lib/message_backend-stack';
import * as dotenv from 'dotenv';
dotenv.config();

const app = new cdk.App();

const environment = process.env.ENVIRONMENT;
if (!environment) throw new Error('ENVIRONMENT not set');

const backendStack = new MessageBackendStack(app, 'msgBackend', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line if you know exactly what Account and Region you want to deploy the stack to. */

  tags: {
    environment: environment,
  },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// 👇 only apply to resources of type Dynamodb table
cdk.Tags.of(backendStack).add('database', 'messageSender', {
  includeResourceTypes: ['AWS::DynamoDB::Table'],
});
