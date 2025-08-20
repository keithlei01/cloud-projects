import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * Simple CDK Stack for creating Cognito User Pool with 3 dummy users
 */
export class CognitoDummyUsersStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool with required configuration
    this.userPool = new cognito.UserPool(this, 'DummyUsersPool', {
      userPoolName: 'cognito-dummy-users-pool',
      
      // Configure sign-in options
      signInAliases: {
        username: true,
        email: true,
      },
      
      // Configure required and optional attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      
      // Configure password policy
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      
      // Account recovery settings
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      
      // Auto-verify email addresses
      autoVerify: {
        email: true,
      },
      
      // Disable MFA for simplicity in development
      mfa: cognito.Mfa.OFF,
      
      // Configure email settings
      email: cognito.UserPoolEmail.withCognito(),
      
      // User invitation settings
      userInvitation: {
        emailSubject: 'Welcome to Cognito Dummy Users Pool',
        emailBody: 'Hello {username}, your temporary password is {####}',
      },
      
      // Removal policy for development (WARNING: This will delete the User Pool when stack is destroyed)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create User Pool Client for application access
    this.userPoolClient = new cognito.UserPoolClient(this, 'DummyUsersPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'cognito-dummy-users-client',
      
      // Configure authentication flows
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      
      // Configure OAuth settings
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
      },
      
      // Security settings
      preventUserExistenceErrors: true,
      
      // Token validity periods
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      
      // Enable token revocation
      enableTokenRevocation: true,
    });

    // Stack Outputs for important resource identifiers
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${this.stackName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${this.stackName}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${this.stackName}-UserPoolArn`,
    });

    new cdk.CfnOutput(this, 'UserPoolProviderName', {
      value: this.userPool.userPoolProviderName,
      description: 'Cognito User Pool Provider Name',
      exportName: `${this.stackName}-UserPoolProviderName`,
    });

    // Define dummy users data
    const dummyUsers = [
      {
        username: 'keithlei',
        email: 'keithlei01@gmail.com',
        firstName: 'Keith',
        lastName: 'Lei'
      },
      {
        username: 'davidlei',
        email: 'davidlei812@gmail.com',
        firstName: 'David',
        lastName: 'Lei'
      },
      {
        username: 'heatherlei',
        email: 'heatherlei719@gmail.com',
        firstName: 'Heather',
        lastName: 'Lei'
      }
    ];

    // Create Lambda function for user management
    const userCreationLambda = new lambda.Function(this, 'UserCreationLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cognito = new AWS.CognitoIdentityServiceProvider();
        
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          const { RequestType, ResourceProperties } = event;
          const { UserPoolId, Users } = ResourceProperties;
          
          try {
            if (RequestType === 'Create' || RequestType === 'Update') {
              console.log('Creating/updating users...');
              
              for (const user of Users) {
                try {
                  // Check if user already exists
                  try {
                    await cognito.adminGetUser({
                      UserPoolId: UserPoolId,
                      Username: user.username
                    }).promise();
                    console.log(\`User \${user.username} already exists, skipping...\`);
                    continue;
                  } catch (error) {
                    if (error.code !== 'UserNotFoundException') {
                      throw error;
                    }
                  }
                  
                  // Create user
                  const params = {
                    UserPoolId: UserPoolId,
                    Username: user.username,
                    UserAttributes: [
                      { Name: 'email', Value: user.email },
                      { Name: 'given_name', Value: user.firstName },
                      { Name: 'family_name', Value: user.lastName },
                      { Name: 'email_verified', Value: 'true' }
                    ],
                    MessageAction: 'SUPPRESS'
                  };
                  
                  await cognito.adminCreateUser(params).promise();
                  console.log(\`User \${user.username} created successfully\`);
                  
                } catch (userError) {
                  console.error(\`Error creating user \${user.username}:\`, userError);
                  if (userError.code !== 'UsernameExistsException') {
                    throw userError;
                  }
                }
              }
              
              return {
                Status: 'SUCCESS',
                PhysicalResourceId: 'cognito-users-' + Date.now(),
                Data: {
                  Message: 'Users created successfully',
                  UserCount: Users.length
                }
              };
              
            } else if (RequestType === 'Delete') {
              console.log('Deleting users...');
              
              for (const user of Users) {
                try {
                  await cognito.adminDeleteUser({
                    UserPoolId: UserPoolId,
                    Username: user.username
                  }).promise();
                  console.log(\`User \${user.username} deleted successfully\`);
                } catch (deleteError) {
                  console.error(\`Error deleting user \${user.username}:\`, deleteError);
                  // Continue with other users even if one fails
                }
              }
              
              return {
                Status: 'SUCCESS',
                PhysicalResourceId: event.PhysicalResourceId,
                Data: {
                  Message: 'Users deleted successfully'
                }
              };
            }
            
          } catch (error) {
            console.error('Error:', error);
            return {
              Status: 'FAILED',
              PhysicalResourceId: event.PhysicalResourceId || 'cognito-users-failed',
              Reason: error.message
            };
          }
        };
      `),
      timeout: cdk.Duration.minutes(5),
      description: 'Lambda function to create and manage Cognito dummy users',
    });

    // Grant Lambda permissions to manage Cognito users
    userCreationLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminGetUser',
        'cognito-idp:ListUsers'
      ],
      resources: [this.userPool.userPoolArn]
    }));

    // Create custom resource to trigger Lambda
    const userCreationCustomResource = new cr.AwsCustomResource(this, 'UserCreationCustomResource', {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: userCreationLambda.functionName,
          Payload: JSON.stringify({
            RequestType: 'Create',
            ResourceProperties: {
              UserPoolId: this.userPool.userPoolId,
              Users: dummyUsers
            }
          })
        },
        physicalResourceId: cr.PhysicalResourceId.of('cognito-users-creation')
      },
      onUpdate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: userCreationLambda.functionName,
          Payload: JSON.stringify({
            RequestType: 'Update',
            ResourceProperties: {
              UserPoolId: this.userPool.userPoolId,
              Users: dummyUsers
            }
          })
        },
        physicalResourceId: cr.PhysicalResourceId.of('cognito-users-creation')
      },
      onDelete: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: userCreationLambda.functionName,
          Payload: JSON.stringify({
            RequestType: 'Delete',
            ResourceProperties: {
              UserPoolId: this.userPool.userPoolId,
              Users: dummyUsers
            }
          })
        }
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE
      })
    });

    // Ensure custom resource runs after User Pool is created
    userCreationCustomResource.node.addDependency(this.userPool);

    // Output the created usernames
    new cdk.CfnOutput(this, 'CreatedUsers', {
      value: dummyUsers.map(user => user.username).join(', '),
      description: 'List of created dummy users',
      exportName: `${this.stackName}-CreatedUsers`,
    });

    // Output instructions for setting passwords
    new cdk.CfnOutput(this, 'PasswordInstructions', {
      value: 'Use AWS CLI: aws cognito-idp admin-set-user-password --user-pool-id <pool-id> --username <username> --password <password> --permanent',
      description: 'Command to set user passwords after deployment',
    });
  }
}