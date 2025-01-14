// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as rawCdkJson from '../../cdk.json';
import { COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME } from '../../lib/utils/constants';
import { CustomInfraSetup } from '../../lib/utils/custom-infra-setup';

describe('When creating the custom resource infrastructure construct', () => {
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        new CustomInfraSetup(stack, 'TestInfraSetup', {
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });

        template = Template.fromStack(stack);
    });

    const customResourceLambdaRole = new Capture();
    const anonymousMetricsLambda = new Capture();

    it('should have a custom resource lambda definition', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Code: Match.anyValue(),
            Role: {
                'Fn::GetAtt': [customResourceLambdaRole, 'Arn']
            },
            Description: 'A custom resource lambda function to perform operations based on operation type',
            Handler: 'lambda_func.handler',
            Runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.name,
            TracingConfig: {
                Mode: 'Active'
            }
        });

        expect(template.toJSON()['Resources'][customResourceLambdaRole.asString()]['Type']).toStrictEqual(
            'AWS::IAM::Role'
        );
    });

    it('should have a custom role and policy attached to the custom resource lambda function', () => {
        expect(template.toJSON()['Resources'][customResourceLambdaRole.asString()]['Properties']).toEqual({
            AssumeRolePolicyDocument: {
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com'
                        }
                    }
                ],
                Version: '2012-10-17'
            },
            Policies: [
                {
                    PolicyDocument: {
                        Statement: [
                            {
                                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
                                Effect: 'Allow',
                                Resource: {
                                    'Fn::Join': [
                                        '',
                                        [
                                            'arn:',
                                            {
                                                'Ref': 'AWS::Partition'
                                            },
                                            ':logs:',
                                            {
                                                'Ref': 'AWS::Region'
                                            },
                                            ':',
                                            {
                                                'Ref': 'AWS::AccountId'
                                            },
                                            ':log-group:/aws/lambda/*'
                                        ]
                                    ]
                                }
                            },
                            {
                                Action: 'logs:PutLogEvents',
                                Effect: 'Allow',
                                Resource: {
                                    'Fn::Join': [
                                        '',
                                        [
                                            'arn:',
                                            {
                                                'Ref': 'AWS::Partition'
                                            },
                                            ':logs:',
                                            {
                                                'Ref': 'AWS::Region'
                                            },
                                            ':',
                                            {
                                                'Ref': 'AWS::AccountId'
                                            },
                                            ':log-group:/aws/lambda/*:log-stream:*'
                                        ]
                                    ]
                                }
                            }
                        ],
                        Version: '2012-10-17'
                    },
                    PolicyName: 'LambdaFunctionServiceRolePolicy'
                }
            ]
        });
    });

    it('should have a x-ray policy for the custom resource lambda function', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            'PolicyDocument': {
                'Statement': [
                    {
                        'Action': ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                        'Effect': 'Allow',
                        'Resource': '*'
                    }
                ],
                'Version': '2012-10-17'
            },
            'PolicyName': Match.anyValue(),
            'Roles': [
                {
                    'Ref': customResourceLambdaRole.asString()
                }
            ]
        });
    });

    it('should have an anonymous metrics lambda definition', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Code: Match.anyValue(),
            Role: {
                'Fn::GetAtt': [customResourceLambdaRole, 'Arn']
            },
            Description: 'A lambda function that runs as per defined schedule to publish metrics',
            Handler: 'lambda_ops_metrics.handler',
            Runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.name,
            TracingConfig: {
                Mode: 'Active'
            },
            Environment: {
                Variables: {
                    POWERTOOLS_SERVICE_NAME: 'ANONYMOUS-CW-METRICS',
                    LOG_LEVEL: 'DEBUG',
                    SOLUTION_ID: rawCdkJson.context.solution_id,
                    SOLUTION_VERSION: rawCdkJson.context.solution_version
                }
            }
        });
    });

    it('should have an anonymous metrics with roles', () => {
        console.log(JSON.stringify(template));
        template.resourceCountIs('AWS::IAM::Role', 2);
        template.hasResourceProperties(
            'AWS::IAM::Role',
            Match.objectEquals({
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com'
                            }
                        }
                    ],
                    Version: '2012-10-17'
                },
                Policies: [
                    {
                        PolicyDocument: {
                            Statement: [
                                {
                                    Action: 'cloudwatch:GetMetricData',
                                    Effect: 'Allow',
                                    Resource: '*'
                                },
                                {
                                    Action: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
                                    Effect: 'Allow',
                                    Resource: {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'arn:',
                                                {
                                                    'Ref': 'AWS::Partition'
                                                },
                                                ':logs:',
                                                {
                                                    'Ref': 'AWS::Region'
                                                },
                                                ':',
                                                {
                                                    'Ref': 'AWS::AccountId'
                                                },
                                                ':log-group:/aws/lambda/*'
                                            ]
                                        ]
                                    }
                                },
                                {
                                    Action: 'logs:PutLogEvents',
                                    Effect: 'Allow',
                                    Resource: {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'arn:',
                                                {
                                                    'Ref': 'AWS::Partition'
                                                },
                                                ':logs:',
                                                {
                                                    'Ref': 'AWS::Region'
                                                },
                                                ':',
                                                {
                                                    'Ref': 'AWS::AccountId'
                                                },
                                                ':log-group:*:log-stream:*'
                                            ]
                                        ]
                                    }
                                }
                            ],
                            Version: '2012-10-17'
                        },
                        PolicyName: 'LambdaFunctionServiceRolePolicy'
                    }
                ]
            })
        );
    });

    it('Should create and attach the anonymous metrics event rule with scheduled expression', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
            ScheduleExpression: 'rate(1 hour)',
            State: 'ENABLED',
            Targets: [
                {
                    Arn: {
                        'Fn::GetAtt': [anonymousMetricsLambda, 'Arn']
                    },
                    Id: 'Target0'
                }
            ]
        });
    });

    it('eventbridge rule should have permissions to invoke lambda ', () => {
        template.hasResourceProperties('AWS::Lambda::Permission', {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::GetAtt': [Match.stringLikeRegexp('ScheduledAnonymousMetrics'), 'Arn']
            },
            Principal: 'events.amazonaws.com',
            SourceArn: {
                'Fn::GetAtt': [Match.stringLikeRegexp('MetricsPublishFrequency'), 'Arn']
            }
        });
    });
});
