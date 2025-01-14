// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const s3Utils = require('./utils/s3-read');
const snsUtils = require('./utils/sns-send-notification');
const SharedLib = require('common-node-lib');

/**
 * This lambda is responsible for sending a notification via SNS to indicate success or failure of a case.
 *
 * @param event Event read from the EventBridge custom bus (orchestratorBus) containing the success or failure information
 * @returns response from sending notification to SNS
 */
exports.handler = async (event) => {
    console.debug('Notification Lambda invoked');
    await this.checkEnvSetup();

    const templateKey = process.env.TEMPLATE_PREFIX + event['detail-type'] + '.email.template';
    console.debug(`Template key is ${templateKey}`);
    const template = await s3Utils.getTemplateFromS3(templateKey);
    let message = template.Body.toString();
    console.debug(`template body is ${message}`);
    const templatePaths = message.match(/<<[\w.]+>>/g); // matches words and periods(for object paths) inside <<>>

    for (const path of templatePaths) {
        try {
            // parses the templated json paths (surrounded by <<>>), and resolves them to the stringified object located at that path in the event body
            const resolvedPath = JSON.stringify(
                path
                    .substring(2, path.length - 2)
                    .split('.')
                    .reduce((o, i) => o[i], event.detail),
                null,
                2
            );

            message = message.replaceAll(path, resolvedPath);
        } catch (error) {
            console.error(`Failed template replacement of path ${path} with error: ${error}`);
        }
    }
    const response = await snsUtils.sendSNSNotification(message);
    return response;
};

exports.checkEnvSetup = async () => {
    s3Utils.checkS3EnvSetup();
    snsUtils.checkSNSEnvSetup();
};
