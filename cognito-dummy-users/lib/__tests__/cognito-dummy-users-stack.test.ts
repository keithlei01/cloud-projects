import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CognitoDummyUsersStack } from '../cognito-dummy-users-stack';

describe('CognitoDummyUsersStack', () => {
  let app: cdk.App;
  let stack: CognitoDummyUsersStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CognitoDummyUsersStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('creates a Cognito User Pool', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'cognito-dummy-users-pool'
    });
  });

  test('creates a Cognito User Pool Client', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ClientName: 'cognito-dummy-users-client'
    });
  });

  test('creates exactly 3 dummy users', () => {
    template.resourceCountIs('AWS::Cognito::UserPoolUser', 3);
  });

  test('creates users with correct usernames', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolUser', {
      Username: 'keithlei'
    });
    
    template.hasResourceProperties('AWS::Cognito::UserPoolUser', {
      Username: 'davidlei'
    });
    
    template.hasResourceProperties('AWS::Cognito::UserPoolUser', {
      Username: 'heatherlei'
    });
  });

  test('creates users with email attributes', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolUser', {
      UserAttributes: [
        { Name: 'email', Value: 'keithlei01@gmail.com' },
        { Name: 'given_name', Value: 'Keith' },
        { Name: 'family_name', Value: 'Lei' },
        { Name: 'email_verified', Value: 'true' }
      ]
    });
  });

  test('has required stack outputs', () => {
    template.hasOutput('UserPoolId', {});
    template.hasOutput('UserPoolClientId', {});
    template.hasOutput('CreatedUsers', {});
    template.hasOutput('PasswordInstructions', {});
  });
});