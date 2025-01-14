#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import os
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import pytest
from operations import operation_types
from operations.copy_web_ui import (
    DESTINATION_BUCKET_NAME,
    SOURCE_BUCKET_NAME,
    SOURCE_PREFIX,
    WEBSITE_CONFIG_PARAM_KEY,
    execute,
    verify_env_setup,
)
from operations.operation_types import PHYSICAL_RESOURCE_ID, RESOURCE, RESOURCE_PROPERTIES

SAMPLE_JSON_VALUE = {"Key1": "FakeValue1", "Key2": {"Key3": "FakeValue3"}}

# fmt: off
os.system(f"cd {Path(__file__).absolute().parents[4]}/ui && npm install && npm run build && cd -")  # nosec - fixture to fake node builds
# fmt:on

local_dir = Path(__file__).absolute().parents[4] / "ui/build"


@pytest.fixture
def lambda_event(aws_credentials, custom_resource_event):
    custom_resource_event[RESOURCE_PROPERTIES] = {RESOURCE: operation_types.COPY_WEB_UI}
    custom_resource_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME] = "fake_source_bucket"
    custom_resource_event[RESOURCE_PROPERTIES][SOURCE_PREFIX] = "web_ui.zip"
    custom_resource_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME] = "fake_destination_bucket"
    custom_resource_event[RESOURCE_PROPERTIES][WEBSITE_CONFIG_PARAM_KEY] = "fake_config_param_key"
    custom_resource_event[PHYSICAL_RESOURCE_ID] = "fake_physical_resource_id"

    yield custom_resource_event


@pytest.fixture
def web_ui_copy_setup(tmp_path, s3, ssm, lambda_event):
    destination_bucket_name = lambda_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME]
    source_bucket_name = lambda_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME]
    source_prefix = lambda_event[RESOURCE_PROPERTIES][SOURCE_PREFIX]

    s3.create_bucket(Bucket=source_bucket_name)
    assert len(list(local_dir.glob("*"))) > 0

    with ZipFile(str(tmp_path / source_prefix), "w", ZIP_DEFLATED) as assert_archive:
        for folder_name, subfolders, filnames in os.walk(local_dir):
            for filename in filnames:
                file_path = os.path.join(folder_name, filename)
                assert_archive.write(file_path, os.path.relpath(file_path, local_dir))
    assert_archive.close()

    s3.meta.client.upload_file(
        str(tmp_path / source_prefix),
        source_bucket_name,
        f"{source_prefix}",
    )

    s3.create_bucket(Bucket=destination_bucket_name)
    os.remove(str(tmp_path / source_prefix))

    test_json_param = json.dumps(SAMPLE_JSON_VALUE)
    ssm.put_parameter(Name="fake_config_param_key", Value=test_json_param, Type="SecureString")

    yield lambda_event, s3, ssm
