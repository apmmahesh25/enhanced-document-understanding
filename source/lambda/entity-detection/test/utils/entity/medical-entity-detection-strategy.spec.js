// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const AWSMock = require('aws-sdk-mock');
const {
    expectedSyncComprehendMedicalResponse,
    blockDictMedical,
    offsetToLineIdMapMedical,
    bondingBoxResultMedical,
    errorCaseOffsetToLineIdMapMedical
} = require('../../event-test-data');

const SharedLib = require('common-node-lib');
const { MedicalEntityDetectionStrategy } = require('../../../utils/entity/medical-entity-detection-strategy');

describe('Get Comprehend API Result:: When provided with correct inputs', () => {
    let publishMetricsSpy;
    const medicalEntityDetectionStrategy = new MedicalEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('ComprehendMedical', 'detectEntitiesV2', (params, callback) => {
            callback(null, expectedSyncComprehendMedicalResponse);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult should pass successfully', async () => {
        const comprehendClient = new AWS.ComprehendMedical(UserAgentConfig.customAwsConfig());
        const actualResponse = await medicalEntityDetectionStrategy.getComprehendResult({
            comprehendClient: comprehendClient,
            pageText: 'test paragraph',
            taskToken: 'fake-token'
        });
        expect(actualResponse).toEqual(expectedSyncComprehendMedicalResponse);
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('addEntityLocations should pass successfully', async () => {
        let entityLocations = {};
        medicalEntityDetectionStrategy.addEntityLocations({
            entityLocations: entityLocations,
            comprehendResponse: expectedSyncComprehendMedicalResponse,
            offsetToLineIdMap: offsetToLineIdMapMedical,
            blockDict: blockDictMedical,
            pageIdx: 0
        });
        expect(entityLocations).toEqual(bondingBoxResultMedical);
    });

    it('addEntityLocations should pass with errors logged', async () => {
        let entityLocations = {};
        const errorSpy = jest.spyOn(console, 'error');
        medicalEntityDetectionStrategy.addEntityLocations({
            entityLocations: entityLocations,
            comprehendResponse: expectedSyncComprehendMedicalResponse,
            offsetToLineIdMap: errorCaseOffsetToLineIdMapMedical,
            blockDict: blockDictMedical,
            pageIdx: 0
        });
        expect(errorSpy).toHaveBeenCalledWith("Determining location of medical entity '{\"Attributes\":[{\"BeginOffset\":546456,\"Category\":\"fake-category\",\"EndOffset\":45846,\"Id\":12345,\"RelationshipScore\":43535,\"RelationshipType\":\"fake-type\",\"Score\":0.996697902,\"Text\":\"fake-text\",\"Traits\":[{\"Name\":\"fake-name\",\"Score\":0.99}],\"Type\":\"fake-type\"}],\"BeginOffset\":10,\"Category\":\"MEDICATION\",\"EndOffset\":14,\"Id\":12345,\"Score\":0.8919363021850586,\"Text\":\"2023\",\"Traits\":[{\"Name\":\"fake-name\",\"Score\":0.98}],\"Type\":\"MEDICATION\",\"MedicalType\":\"DX_NAME\"}' failed with error: Error: Bounding box computation failed for entity '2023' at offset 10. Got error: Cannot read properties of undefined (reading 'Text')");
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.ENTITY_DETECTION_LANGUAGE;
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('ComprehendMedical');
    });
});

describe('Get ComprehendMedical API Result:: fails', () => {
    let publishMetricsSpy;
    const medicalEntityDetectionStrategy = new MedicalEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('ComprehendMedical', 'detectEntitiesV2', (params, callback) => {
            callback(new Error('detectEntitiesV2 error'), null);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult fails', async () => {
        const comprehendClient = new AWS.ComprehendMedical(UserAgentConfig.customAwsConfig());
        await expect(
            medicalEntityDetectionStrategy.getComprehendResult({
                comprehendClient: comprehendClient,
                pageText: 'test paragraph',
                taskToken: 'fake-token'
            })
        ).rejects.toThrow('detectEntitiesV2 error');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('ComprehendMedical');
    });
});
