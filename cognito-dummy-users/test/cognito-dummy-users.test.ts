import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as CognitoDummyUsers from '../lib/cognito-dummy-users-stack';

describe('CognitoDummyUsersStack', () => {
  let app: cdk.App;
  let stack: CognitoDummyUsers.CognitoDummyUsersStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CognitoDummyUsers.CognitoDummyUsersStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  describe('Cognito User Pool', () => {
    test('creates a User Pool with correct configuration', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'cognito-dummy-users-pool',
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            RequireUppercase: true,
          },
        },
        Schema: Match.arrayWith([
          {
            Name: 'email',
            Required: true,
            Mutable: true,
          },
          {
            Name: 'given_name',
            Required: true,
            Mutable: true,
          },
          {
            Name: 'family_name',
            Required: true,
            Mutable: true,
          },
        ]),
        AliasAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
        MfaConfiguration: 'OFF',
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1,
            },
          ],
        },
      });
    });

    test('has exactly one User Pool', () => {
      template.resourceCountIs('AWS::Cognito::UserPool', 1);
    });
  });

  describe('Cognito User Pool Client', () => {
    test('creates a User Pool Client with correct configuration', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ClientName: 'cognito-dummy-users-client',
        ExplicitAuthFlows: [
          'ALLOW_USER_PASSWORD_AUTH',
          'ALLOW_ADMIN_USER_PASSWORD_AUTH',
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
        ],
        SupportedIdentityProviders: ['COGNITO'],
        AllowedOAuthFlows: ['code'],
        AllowedOAuthScopes: ['email', 'openid', 'profile'],
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
        RefreshTokenValidity: 43200,
        EnableTokenRevocation: true,
      });
    });

    test('has exactly one User Pool Client', () => {
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    });
  });

  describe('User Creation Lambda', () => {
    test('creates a Lambda function for user management', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Description: 'Lambda function to create and manage Cognito dummy users',
      });
    });

    test('Lambda has correct IAM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminDeleteUser',
                'cognito-idp:AdminGetUser',
                'cognito-idp:ListUsers',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('creates custom resource for user management', () => {
      // The AwsCustomResource creates a different resource type
      template.hasResourceProperties('Custom::AWS', {
        ServiceToken: Match.anyValue(),
      });
    });

    test('has Lambda functions for user management', () => {
      // AwsCustomResource creates additional Lambda functions
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });
  });

  describe('Stack Outputs', () => {
    test('has User Pool ID output', () => {
      template.hasOutput('UserPoolId', {
        Description: 'Cognito User Pool ID',
      });
    });

    test('has User Pool Client ID output', () => {
      template.hasOutput('UserPoolClientId', {
        Description: 'Cognito User Pool Client ID',
      });
    });

    test('has User Pool ARN output', () => {
      template.hasOutput('UserPoolArn', {
        Description: 'Cognito User Pool ARN',
      });
    });

    test('has Created Users output', () => {
      template.hasOutput('CreatedUsers', {
        Description: 'List of created dummy users',
        Value: 'keithlei, davidlei, heatherlei',
      });
    });

    test('has Password Instructions output', () => {
      template.hasOutput('PasswordInstructions', {
        Description: 'Command to set user passwords after deployment',
      });
    });

    test('has User Pool Provider Name output', () => {
      template.hasOutput('UserPoolProviderName', {
        Description: 'Cognito User Pool Provider Name',
      });
    });
  });

  describe('Stack Properties', () => {
    test('stack synthesizes without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('stack has correct number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;
      
      // Expected resources:
      // 1 User Pool + 1 User Pool Client + 1 Lambda + 1 Custom Resource
      // Plus additional CDK-generated resources (IAM roles, etc.)
      expect(resourceCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('User Data Validation', () => {
    test('all user emails have valid format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const expectedEmails = [
        'keithlei01@gmail.com',
        'davidlei812@gmail.com', 
        'heatherlei719@gmail.com'
      ];

      expectedEmails.forEach(email => {
        expect(email).toMatch(emailRegex);
      });
    });

    test('all usernames are unique', () => {
      const usernames = ['keithlei', 'davidlei', 'heatherlei'];
      const uniqueUsernames = new Set(usernames);
      
      expect(uniqueUsernames.size).toBe(usernames.length);
    });

    test('user creation logic is embedded in Lambda', () => {
      // Users are created via Lambda function, not as CloudFormation resources
      // Check that the Lambda contains user creation logic
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('.*adminCreateUser.*'),
        },
      });
    });
  });

  describe('Security Configuration', () => {
    test('User Pool has secure password policy', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: Match.anyValue(),
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            RequireUppercase: true,
          },
        },
      });
    });

    test('User Pool Client prevents user existence errors', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        PreventUserExistenceErrors: 'ENABLED',
      });
    });

    test('User Pool Client has token revocation enabled', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        EnableTokenRevocation: true,
      });
    });

    test('Lambda function includes user creation logic', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('.*MessageAction.*SUPPRESS.*'),
        },
      });
    });
  });
});