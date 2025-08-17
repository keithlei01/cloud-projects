import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import { DUMMY_USERS } from './user-data';

/**
 * CDK Stack for creating Cognito User Pool with dummy users
 * This stack creates the core Cognito infrastructure including User Pool and Client
 */
export class CognitoDummyUsersStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userCreationLambda: lambda.Function;

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

    // Create Lambda function for user creation
    this.userCreationLambda = new lambda.Function(this, 'UserCreationLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'user-creation-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      description: 'Lambda function to create dummy users in Cognito User Pool',
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
      },
    });

    // Create IAM role for Lambda with Cognito permissions
    const cognitoPermissions = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminGetUser',
        'cognito-idp:ListUsers',
      ],
      resources: [this.userPool.userPoolArn],
    });

    this.userCreationLambda.addToRolePolicy(cognitoPermissions);

    // Create custom resource provider
    const userCreationProvider = new cr.Provider(this, 'UserCreationProvider', {
      onEventHandler: this.userCreationLambda,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create custom resource to trigger user creation
    const userCreationResource = new cdk.CustomResource(this, 'UserCreationResource', {
      serviceToken: userCreationProvider.serviceToken,
      properties: {
        UserPoolId: this.userPool.userPoolId,
        Users: DUMMY_USERS,
        // Add a timestamp to force updates when needed
        Timestamp: Date.now().toString(),
      },
    });

    // Ensure proper dependency management - users are created after User Pool and Client
    userCreationResource.node.addDependency(this.userPool);
    userCreationResource.node.addDependency(this.userPoolClient);

    // Add output for created users
    new cdk.CfnOutput(this, 'CreatedUsers', {
      value: DUMMY_USERS.map(user => user.username).join(', '),
      description: 'List of created dummy users',
      exportName: `${this.stackName}-CreatedUsers`,
    });

    // Add output for user creation Lambda ARN
    new cdk.CfnOutput(this, 'UserCreationLambdaArn', {
      value: this.userCreationLambda.functionArn,
      description: 'ARN of the user creation Lambda function',
      exportName: `${this.stackName}-UserCreationLambdaArn`,
    });
  }
}