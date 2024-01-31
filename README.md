# Serverless Message Handeling Backend with CDK
This repository contains AWS Lambda functions that are written in Node.js (TypeScript).

## Infrastructure Deployment

The infrastructure for these Lambda functions is deployed using the AWS Cloud Development Kit (CDK).

## AWS Services Used

The following AWS services are used in this project:

- **AWS Lambda**: The core service where the functions are hosted and run.
- **Amazon DynamoDB**: Used for storing and retrieving data.
- **Amazon S3**: Used for storing files.
- **Amazon API Gateway**: Used as the HTTP interface for the Lambda functions.

## SETUP

### Prerequisite
* IAM Credentials must be configured

### Installation
* Installing Packages
  `npm install`
* Boostrapping for CDK Operation `cdk bootsrap`
* Deploying in CDK `cdk deploy`
  
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/31379261-86b37105-9530-4549-bd10-cdd4c915b0ef?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D31379261-86b37105-9530-4549-bd10-cdd4c915b0ef%26entityType%3Dcollection%26workspaceId%3D392c3a34-1b4e-4f04-8e66-5ff0349ba141)
