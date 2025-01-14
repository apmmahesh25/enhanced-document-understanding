// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as rawCdkJson from '../../cdk.json';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { DusStack } from '../../lib/dus-stack';
import { AppRegistry } from '../../lib/utils/app-registry-aspects';

describe('When Solution Stack with a nested stack is registered with AppRegistry', () => {
    let template: Template;
    let app: cdk.App;
    let stack: DusStack;
    const appRegApplicationCapture = new Capture();
    const expectedTags = {
        'Solutions:ApplicationType': 'AWS-Solutions',
        'Solutions:SolutionID': 'SO0281',
        'Solutions:SolutionName': 'enhanced-document-understanding-on-aws',
        'Solutions:SolutionVersion': rawCdkJson.context.solution_version
    };

    const applicationName = `App-${rawCdkJson.context.app_registry_name}`;

    beforeAll(() => {
        app = new cdk.App({
            context: rawCdkJson.context
        });

        stack = new DusStack(app, 'TestStack', {
            solutionID: rawCdkJson.context.solution_id,
            solutionName: rawCdkJson.context.solution_name,
            solutionVersion: rawCdkJson.context.solution_version,
            appNamespace: rawCdkJson.context.app_namespace,
            applicationTrademarkName: rawCdkJson.context.application_trademark_name
        });
        cdk.Aspects.of(app).add(
            new AppRegistry(stack, 'AppRegistryAspect', {
                solutionName: rawCdkJson.context.solution_name,
                applicationName: rawCdkJson.context.app_registry_name,
                solutionID: rawCdkJson.context.solution_id,
                solutionVersion: rawCdkJson.context.solution_version,
                applicationType: rawCdkJson.context.application_type
            })
        );
        template = Template.fromStack(stack);
    });

    it('should create a ServiceCatalogueRegistry Application', () => {
        expect(app.node.tryGetContext('app_registry_name')).toStrictEqual('enhanced-document-understanding');
        expect(app.node.tryGetContext('solution_name')).toStrictEqual('enhanced-document-understanding-on-aws');
        template.resourceCountIs('AWS::ServiceCatalogAppRegistry::Application', 1);
        template.hasResourceProperties('AWS::ServiceCatalogAppRegistry::Application', {
            Name: 'App-enhanced-document-understanding',
            Description: `Service Catalog application to track and manage all your resources for the solution ${expectedTags['Solutions:SolutionName']}`,
            Tags: expectedTags
        });
    });

    it('should create ResourceAssociation for parent stack', () => {
        template.resourceCountIs('AWS::ServiceCatalogAppRegistry::ResourceAssociation', 1);
        template.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: {
                'Fn::GetAtt': [appRegApplicationCapture, 'Id']
            },
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });
    });

    it('should create ResourceAssociation for Textract Nested Stack', () => {
        const textractStack = stack.textractWorkflow;
        const nestedTemplate = Template.fromStack(textractStack);
        nestedTemplate.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: 'App-enhanced-document-understanding',
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });

        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [appRegApplicationCapture.asString()],
            UpdateReplacePolicy: Match.anyValue(),
            DeletionPolicy: Match.anyValue(),
            Condition: 'DeployTextractWorkflow'
        });
    });

    it('should create ResourceAssociation for Redaction Nested Stack', () => {
        const redactionStack = stack.redactionWorkflow;
        const nestedTemplate = Template.fromStack(redactionStack);
        nestedTemplate.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: applicationName,
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });

        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [appRegApplicationCapture.asString()],
            UpdateReplacePolicy: Match.anyValue(),
            DeletionPolicy: Match.anyValue(),
            Condition: 'DeployRedactionWorkflow'
        });
    });

    it('should create ResourceAssociation for Entity Detection Nested Stack', () => {
        const entityDetectionStack = stack.entityDetectionWorkflow;
        const nestedTemplate = Template.fromStack(entityDetectionStack);
        nestedTemplate.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: applicationName,
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });

        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [appRegApplicationCapture.asString()],
            UpdateReplacePolicy: Match.anyValue(),
            DeletionPolicy: Match.anyValue(),
            Condition: 'DeployComprehendWorkflow'
        });
    });

    it('should create ResourceAssociation for Kendra Nested Stack', () => {
        const kendraStack = stack.indexedStorage.kendraCaseSearch;
        const nestedTemplate = Template.fromStack(kendraStack);
        nestedTemplate.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: applicationName,
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });

        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [appRegApplicationCapture.asString()],
            UpdateReplacePolicy: Match.anyValue(),
            DeletionPolicy: Match.anyValue(),
            Condition: Match.stringLikeRegexp('IndexedStorageParametersDeployKendraIndexCondition*')
        });
    });

    it('should create ResourceAssociation for Sample Documents Nested Stack', () => {
        const sampleDocumentsStack: cdk.NestedStack = stack.sampleDocuments;
        const nestedTemplate = Template.fromStack(sampleDocumentsStack);
        nestedTemplate.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: applicationName,
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });

        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [appRegApplicationCapture.asString(), Match.anyValue()],
            UpdateReplacePolicy: Match.anyValue(),
            DeletionPolicy: Match.anyValue(),
            Condition: 'DeploySamples'
        });
    });

    it('should create ResourceAssociation for WebApp Nested Stack', () => {
        const webAppStack = stack.uiInfrastructure.nestedUIStack;
        const nestedTemplate = Template.fromStack(webAppStack);
        nestedTemplate.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
            Application: applicationName,
            Resource: {
                Ref: 'AWS::StackId'
            },
            ResourceType: 'CFN_STACK'
        });

        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [appRegApplicationCapture.asString(), Match.anyValue(), Match.anyValue()],
            UpdateReplacePolicy: Match.anyValue(),
            DeletionPolicy: Match.anyValue(),
            Condition: 'DeployWebApp'
        });
    });

    const attGrpCapture = new Capture();
    it('should have AttributeGroupAssociation', () => {
        template.resourceCountIs('AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation', 1);
        template.hasResourceProperties('AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation', {
            Application: {
                'Fn::GetAtt': [Match.stringLikeRegexp('AppRegistryAspectRegistrySetup*'), 'Id']
            },
            AttributeGroup: {
                'Fn::GetAtt': [attGrpCapture, 'Id']
            }
        });
        expect(template.toJSON()['Resources'][attGrpCapture.asString()]['Type']).toStrictEqual(
            'AWS::ServiceCatalogAppRegistry::AttributeGroup'
        );
    });

    it('should have AttributeGroup', () => {
        template.resourceCountIs('AWS::ServiceCatalogAppRegistry::AttributeGroup', 1);
        template.hasResourceProperties('AWS::ServiceCatalogAppRegistry::AttributeGroup', {
            Attributes: {
                applicationType: 'AWS-Solutions',
                solutionID: 'SO0281',
                solutionName: expectedTags['Solutions:SolutionName'],
                version: expectedTags['Solutions:SolutionVersion']
            },
            Name: {
                'Fn::Join': [
                    '',
                    [
                        'AttrGrp-',
                        {
                            'Ref': 'AWS::StackName'
                        }
                    ]
                ]
            },
            Description: 'Attributes for Solutions Metadata'
        });
    });
});
