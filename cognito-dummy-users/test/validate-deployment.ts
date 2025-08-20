#!/usr/bin/env ts-node

/**
 * Standalone deployment validation script
 * This script can be run independently to validate a deployed stack
 */

import { 
  CognitoIdentityProviderClient, 
  AdminGetUserCommand, 
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  CloudFormationClient, 
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

interface ValidationConfig {
  stackName: string;
  region: string;
  expectedUsers: string[];
}

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

class DeploymentValidator {
  private cognitoClient: CognitoIdentityProviderClient;
  private cloudFormationClient: CloudFormationClient;
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
    this.cognitoClient = new CognitoIdentityProviderClient({ 
      region: config.region 
    });
    this.cloudFormationClient = new CloudFormationClient({ 
      region: config.region 
    });
  }

  async validateDeployment(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      // 1. Validate stack exists and is in good state
      results.push(await this.validateStackStatus());

      // 2. Extract stack outputs
      const outputs = await this.getStackOutputs();
      results.push(await this.validateStackOutputs(outputs));

      // 3. Validate User Pool exists
      const userPoolId = outputs['UserPoolId'];
      if (userPoolId) {
        results.push(await this.validateUserPool(userPoolId));
        
        // 4. Validate users exist
        results.push(await this.validateUsers(userPoolId));
        
        // 5. Validate user attributes
        results.push(await this.validateUserAttributes(userPoolId));
      }

    } catch (error) {
      results.push({
        success: false,
        message: 'Validation failed with error',
        details: (error as Error).message
      });
    }

    return results;
  }

  private async validateStackStatus(): Promise<ValidationResult> {
    try {
      const command = new DescribeStacksCommand({
        StackName: this.config.stackName,
      });

      const response = await this.cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];

      if (!stack) {
        return {
          success: false,
          message: `Stack ${this.config.stackName} not found`
        };
      }

      if (stack.StackStatus !== 'CREATE_COMPLETE' && stack.StackStatus !== 'UPDATE_COMPLETE') {
        return {
          success: false,
          message: `Stack is in unexpected state: ${stack.StackStatus}`
        };
      }

      return {
        success: true,
        message: `Stack ${this.config.stackName} is in good state: ${stack.StackStatus}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate stack status',
        details: (error as Error).message
      };
    }
  }

  private async getStackOutputs(): Promise<Record<string, string>> {
    const command = new DescribeStacksCommand({
      StackName: this.config.stackName,
    });

    const response = await this.cloudFormationClient.send(command);
    const stack = response.Stacks?.[0];
    
    if (!stack?.Outputs) {
      throw new Error('No stack outputs found');
    }

    const outputs: Record<string, string> = {};
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    }

    return outputs;
  }

  private async validateStackOutputs(outputs: Record<string, string>): Promise<ValidationResult> {
    const requiredOutputs = [
      'UserPoolId',
      'UserPoolClientId', 
      'UserPoolArn',
      'CreatedUsers',
      'PasswordInstructions',
      'UserPoolProviderName'
    ];

    const missingOutputs = requiredOutputs.filter(key => !outputs[key]);

    if (missingOutputs.length > 0) {
      return {
        success: false,
        message: 'Missing required stack outputs',
        details: { missingOutputs, availableOutputs: Object.keys(outputs) }
      };
    }

    return {
      success: true,
      message: 'All required stack outputs are present',
      details: { outputCount: Object.keys(outputs).length }
    };
  }

  private async validateUserPool(userPoolId: string): Promise<ValidationResult> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
      });

      const response = await this.cognitoClient.send(command);
      
      return {
        success: true,
        message: `User Pool ${userPoolId} is accessible`,
        details: { userCount: response.Users?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to access User Pool',
        details: (error as Error).message
      };
    }
  }

  private async validateUsers(userPoolId: string): Promise<ValidationResult> {
    try {
      const existingUsers: string[] = [];
      const missingUsers: string[] = [];

      for (const username of this.config.expectedUsers) {
        try {
          const command = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: username,
          });

          await this.cognitoClient.send(command);
          existingUsers.push(username);
        } catch (error) {
          if ((error as any).name === 'UserNotFoundException') {
            missingUsers.push(username);
          } else {
            throw error;
          }
        }
      }

      if (missingUsers.length > 0) {
        return {
          success: false,
          message: 'Some expected users are missing',
          details: { existingUsers, missingUsers }
        };
      }

      return {
        success: true,
        message: 'All expected users exist',
        details: { userCount: existingUsers.length, users: existingUsers }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate users',
        details: (error as Error).message
      };
    }
  }

  private async validateUserAttributes(userPoolId: string): Promise<ValidationResult> {
    try {
      const expectedAttributes = ['email', 'given_name', 'family_name', 'email_verified'];
      const validationResults: any[] = [];

      for (const username of this.config.expectedUsers) {
        const command = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: username,
        });

        const response = await this.cognitoClient.send(command);
        const attributes = response.UserAttributes || [];
        
        const userValidation = {
          username,
          hasAllAttributes: true,
          missingAttributes: [] as string[],
          attributes: {} as Record<string, string>
        };

        for (const expectedAttr of expectedAttributes) {
          const attr = attributes.find(a => a.Name === expectedAttr);
          if (attr?.Value) {
            userValidation.attributes[expectedAttr] = attr.Value;
          } else {
            userValidation.hasAllAttributes = false;
            userValidation.missingAttributes.push(expectedAttr);
          }
        }

        validationResults.push(userValidation);
      }

      const usersWithMissingAttrs = validationResults.filter(u => !u.hasAllAttributes);

      if (usersWithMissingAttrs.length > 0) {
        return {
          success: false,
          message: 'Some users have missing attributes',
          details: { usersWithMissingAttrs }
        };
      }

      return {
        success: true,
        message: 'All users have required attributes',
        details: { validationResults }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate user attributes',
        details: (error as Error).message
      };
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: ts-node validate-deployment.ts [options]

Options:
  --stack-name <name>    Stack name to validate (default: CognitoDummyUsersStack)
  --region <region>      AWS region (default: ap-east-1)
  --help, -h            Show this help message

Environment Variables:
  AWS_REGION            AWS region to use
  AWS_PROFILE           AWS profile to use
  STACK_NAME            Stack name to validate
    `);
    process.exit(0);
  }

  const config: ValidationConfig = {
    stackName: getArgValue(args, '--stack-name') || process.env.STACK_NAME || 'CognitoDummyUsersStack',
    region: getArgValue(args, '--region') || process.env.AWS_REGION || 'ap-east-1',
    expectedUsers: ['keithlei', 'davidlei', 'heatherlei']
  };

  console.log('🔍 Starting deployment validation...');
  console.log(`Stack: ${config.stackName}`);
  console.log(`Region: ${config.region}`);
  console.log('');

  const validator = new DeploymentValidator(config);
  const results = await validator.validateDeployment();

  let allPassed = true;
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.message}`);
    
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    
    if (!result.success) {
      allPassed = false;
    }
    console.log('');
  }

  if (allPassed) {
    console.log('🎉 All validation checks passed!');
    process.exit(0);
  } else {
    console.log('❌ Some validation checks failed!');
    process.exit(1);
  }
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export { DeploymentValidator, ValidationConfig, ValidationResult };