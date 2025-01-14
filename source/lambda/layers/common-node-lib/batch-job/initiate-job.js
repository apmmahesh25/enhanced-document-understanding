// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const _sfn = require('../stepfunctions/task-notify');

const _ = require('lodash');

/**
 * Common function that executes the callback runSyncJob function to process
 * records in the sqs queue trigger. It accepts a requestAccountId which is propagated
 * to the callback function for any s3 api calls to set the expected bucket owner parameter
 * @param {Array<Object>} records sqs records array
 * @param {Function} runSyncJob
 * @param {string} requestAccountId
 */
async function processRecordsSync(records, runSyncJob, requestAccountId) {
    if (!records || records.length == 0) console.log('No records received to process.');
    else {
        for (let sqsRecord of records) {
            const { taskToken } = JSON.parse(sqsRecord.body);
            let finalResponse = JSON.parse(sqsRecord.body).input;

            try {
                await _sfn.sendTaskHeartbeat(taskToken);
                const serviceResponse = await runSyncJob(taskToken, sqsRecord, requestAccountId);

                if ('inferences' in finalResponse) {
                    finalResponse.inferences = _.merge(finalResponse.inferences, serviceResponse.inferences);
                } else {
                    finalResponse = _.merge(finalResponse, serviceResponse);
                }

                await _sfn.sendTaskSuccess(finalResponse, taskToken);
            } catch (error) {
                console.error(`Error occurred in textract sync job for taskToken: ${taskToken}. ${error.message}`);
                await _sfn.sendTaskFailure(error, taskToken);
            }
        }
    }
}

module.exports = { processRecordsSync };
