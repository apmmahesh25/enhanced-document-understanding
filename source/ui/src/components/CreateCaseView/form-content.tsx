// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
    Button,
    Container,
    Form,
    FormField,
    Header,
    Input,
    SpaceBetween,
    StatusIndicator,
    Checkbox
} from '@cloudscape-design/components';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export function FormHeader() {
    return <Header variant="h1">Create case</Header>;
}

function BaseFormContent({ content, onCancelClick, errorText = null, onCreateClick, currentStatus }: any) {
    let statusLabel = '';
    if (currentStatus === 'success') {
        statusLabel = 'Case created';
    } else if (currentStatus === 'error') {
        statusLabel = 'Case creation failed';
    } else if (currentStatus === 'loading') {
        statusLabel = 'Creating case';
    }
    return (
        <form onSubmit={(event) => event.preventDefault()}>
            <Form
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <StatusIndicator type={currentStatus}> {statusLabel} </StatusIndicator>
                        <span>&nbsp;&nbsp;</span>
                        <Button data-testid="create-case-button" variant="primary" onClick={onCreateClick}>
                            Create case
                        </Button>
                        <Button variant="link" onClick={onCancelClick}>
                            Cancel
                        </Button>
                    </SpaceBetween>
                }
                errorText={errorText}
                errorIconAriaLabel="Error"
            >
                {content}
            </Form>
        </form>
    );
}

export function FormContent({ handleButtonClick, caseNameError, currentStatus }: any) {
    const [caseName, setCaseName] = React.useState('');
    const [enableBackendUpload, setEnableBackendUpload] = React.useState(false);
    const navigate = useNavigate();
    return (
        <BaseFormContent
            content={
                <Container>
                    <SpaceBetween size="xs">
                        <FormField
                            label="Case name"
                            errorText={caseNameError}
                            i18nStrings={{ errorIconAriaLabel: 'Error' }}
                            data-testid="case-name-field"
                        >
                            <Input
                                ariaRequired={true}
                                value={caseName}
                                onChange={(event) => setCaseName(event.detail.value)}
                                data-testid="case-name-input"
                            />
                        </FormField>
                        <FormField
                            label="Backend Upload"
                            description="allows the user to upload directly through the s3 console"
                            data-testid="case-bulk-upload"
                        >
                            <Checkbox
                                onChange={({ detail }) => setEnableBackendUpload(detail.checked)}
                                checked={enableBackendUpload}
                            >
                                Enable
                            </Checkbox>
                        </FormField>
                    </SpaceBetween>
                </Container>
            }
            onCancelClick={() => navigate(`/`)}
            onCreateClick={() => handleButtonClick(caseName, enableBackendUpload)}
            currentStatus={currentStatus}
        />
    );
}
