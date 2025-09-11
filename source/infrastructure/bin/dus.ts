#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { AwsSolutionsChecks } from 'cdk-nag';
import { DusStack } from '../lib/dus-stack';
import {
    ApiGatewayEndpointTypeResourceObserver,
    CfnResourceObserver,
    CognitoUserPoolAdvancedSecurityModeObserver,
    LambdaRuntimeResourceObserver,
    S3WebResourceObserver
} from '../lib/govcloud/cfn-resource-observer';

import { AwsDeploymentPartitionAspects } from '../lib/utils/aws-deployment-partition-aspects';
import { LambdaAspects } from '../lib/utils/lambda-aspect';

const app = new cdk.App();
const solutionID = process.env.SOLUTION_ID ?? app.node.tryGetContext('solution_id');
const version = process.env.VERSION ?? app.node.tryGetContext('solution_version');
const solutionName = process.env.SOLUTION_NAME ?? app.node.tryGetContext('solution_name');
const namespace = process.env.APP_NAMESPACE ?? app.node.tryGetContext('app_namespace');

const applicationTrademarkName = app.node.tryGetContext('application_trademark_name');

const dus = new DusStack(app, 'DocUnderstanding', {
    description: `(${solutionID}) - ${solutionName}. Version ${version}`,
    synthesizer: new cdk.DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
    }),
    solutionID: solutionID,
    solutionVersion: version,
    solutionName: solutionName,
    appNamespace: namespace,
    applicationTrademarkName: applicationTrademarkName
});

// adding cdk-nag checks
cdk.Aspects.of(app).add(new AwsSolutionsChecks());

// adding lambda layer to all lambda functions for injecting user-agent for SDK calls to AWS services.
cdk.Aspects.of(app).add(
    new LambdaAspects(dus, 'AspectInject', {
        solutionID: solutionID,
        solutionVersion: version
    })
);

const cfnObserverMap = new Map<string, CfnResourceObserver[]>();
cfnObserverMap.set(lambda.Function.name, [new LambdaRuntimeResourceObserver()]);
cfnObserverMap.set(cdk.CfnStack.name, [new S3WebResourceObserver()]);
cfnObserverMap.set(api.CfnRestApi.name, [new ApiGatewayEndpointTypeResourceObserver()]);
cfnObserverMap.set(cognito.CfnUserPool.name, [new CognitoUserPoolAdvancedSecurityModeObserver()]);

cdk.Aspects.of(app).add(new AwsDeploymentPartitionAspects(cfnObserverMap));

app.synth();
