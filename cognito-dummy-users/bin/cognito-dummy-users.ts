#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoDummyUsersStack } from '../lib';

const app = new cdk.App();

// Get environment configuration from CDK context or environment variables
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'ap-east-1';

// Support custom stack name for integration testing
const stackName = process.env.CDK_STACK_NAME || 'CognitoDummyUsersStack';

// Create the stack with proper naming and environment settings
new CognitoDummyUsersStack(app, stackName, {
    env: {
        account: account,
        region: region,
    },
    description: 'AWS CDK Stack for creating Cognito User Pool with 3 dummy users',

    // Add stack tags for better resource management
    tags: {
        Project: 'cognito-dummy-users',
        Environment: app.node.tryGetContext('environment') || 'development',
        ManagedBy: 'AWS CDK',
    },
});