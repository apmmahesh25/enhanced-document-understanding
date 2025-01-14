// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { PythonUserAgentLayer } from '../../lib/layers/python-user-agent';
import { NodejsSharedLibLayer } from '../../lib/layers/shared-lib';
import {
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
    GOV_CLOUD_REGION_LAMBDA_NODE_RUNTIME,
    GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME
} from '../../lib/utils/constants';

describe('When injecting Nodejs shared library and aws-sdk library layer', () => {
    let template: Template;

    beforeAll(() => {
        template = Template.fromStack(buildStack(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME));
    });

    it('should only inject in Node runtime lambda', () => {
        const layerCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: [GOV_CLOUD_REGION_LAMBDA_NODE_RUNTIME.name, COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.name],
            Content: Match.anyValue()
        });

        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: layerCapture
        });

        expect(template.toJSON()['Resources'][layerCapture.asArray()[0]['Ref']]['Type']).toEqual(
            'AWS::Lambda::LayerVersion'
        );
        expect(template.toJSON()['Resources'][layerCapture.asArray()[0]['Ref']]['Properties']['Description']).toEqual(
            'A layer for Nodejs libraries'
        );
    });
});

describe('When injecting Nodejs shared library and aws-sdk library layer', () => {
    it('should throw an exception if the runtime is python', () => {
        try {
            buildStack(lambda.Runtime.PYTHON_3_8);
        } catch (error) {
            expect((error as Error).message).toEqual(
                `This lambda function uses a runtime that is incompatible with this layer (${lambda.Runtime.PYTHON_3_8} is not in [${GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME.name}, ${COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.name}])`
            );
        }
    });
});

describe('When injecting Python shared library and boto3 library layer', () => {
    let template: Template;

    beforeAll(() => {
        template = Template.fromStack(buildStack(COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME));
    });

    it('should inject python boto3 and python shared library layer', () => {
        const layerCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: [
                GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME.name,
                COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.name
            ],
            Content: Match.anyValue()
        });

        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: layerCapture
        });

        expect(template.toJSON()['Resources'][layerCapture.asArray()[0]['Ref']]['Type']).toEqual(
            'AWS::Lambda::LayerVersion'
        );
        expect(template.toJSON()['Resources'][layerCapture.asArray()[0]['Ref']]['Properties']['Description']).toEqual(
            'A layer for Python Lambda functions'
        );
    });
});

function buildStack(runtime: lambda.Runtime): cdk.Stack {
    const stack = new cdk.Stack();
    if (runtime.family === lambda.RuntimeFamily.NODEJS) {
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
            runtime: runtime,
            handler: 'index.handler',
            layers: [
                new NodejsSharedLibLayer(stack, 'NodejsSharedLibLayer', {
                    entry: '../lambda/layers/common-node-lib',
                    description: 'A layer for Nodejs libraries',
                    compatibleRuntimes: [GOV_CLOUD_REGION_LAMBDA_NODE_RUNTIME, COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME]
                })
            ]
        });
    } else if (runtime.family === lambda.RuntimeFamily.PYTHON) {
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/python-lambda'),
            runtime: runtime,
            handler: 'function.handler',
            layers: [
                new PythonUserAgentLayer(stack, 'PythonUserAgent', {
                    entry: '../lambda/layers/custom_boto3_init',
                    description: 'A layer for Python Lambda functions',
                    compatibleRuntimes: [
                        GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME,
                        COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME
                    ]
                })
            ]
        });
    } else {
        throw new Error(`Unsupported runtime ${runtime} provided`);
    }

    return stack;
}
