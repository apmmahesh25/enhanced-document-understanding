# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-11

### Security

- Upgraded netty to `4.2.126`

### Changed

- Removed use of AWS Service Catalog AppRegistry

## [1.1.18] - 2025-08-21

### Security

- Upgraded netty to `2.32.26`
- Upgraded tmp to `0.2.5`

## [1.1.17] - 2025-07-24

### Security

- Upgraded form-data to `4.0.4`
- Upgraded @eslint/plugin-kit to `0.3.4`
- Upgraded urllib3 to `2.5.0`
- Upgraded requests to `2.32.4`
- Upgraded on-headers to `1.1.0`
- Upgraded webpack-dev-server to `5.2.2`
- Upgraded aws-cdk to `2.1021.0`
- Upgraded aws-cdk-lib to `2.206.0`
- Upgraded brace-expansion to `2.0.2`

## [1.1.16] - 2025-06-04

### Security

- Upgraded testcontainers > dockerode > tar-fs to `2.1.3`
- Upgraded testcontainers > tar-fs to `3.0.9`

## [1.1.15] - 2025-05-22

### Security

- Upgraded setuptools to `80.8.0`
- Upgraded http-proxy-middleware to `2.0.9`
- Upgraded aws-cdk-lib to `2.196.1`
- Upgraded undici to `5.29.0`

## [1.1.14] - 2025-04-03

### Security

- Upgraded tar-fs to `2.1.2`
- Upgraded aws-cdk-lib to `2.187.0`
- Upgraded aws-cdk to `2.1006.0`
- Upgraded image-size to `1.2.1`

## [1.1.13] - 2025-03-12

### Security

- Upgraded axios to `1.8.2`
- Upgraded @babel/helpers to `7.26.10`

## [1.1.12] - 2025-03-06

### Security

- Updated node and python package versions to patch vulnerabilities

## [1.1.11] - 2025-02-21

### Security

- Updated node and python package versions to patch vulnerabilities

## [1.1.10] - 2025-01-28

### Security

- Updated node modules to patch vulnerabilities

### Fixed

- Raw text rendering in the UI. See [GitHub issue](https://github.com/aws-solutions/enhanced-document-understanding-on-aws/issues/87) for further details.

## [1.1.9] - 2025-01-14

### Security

- Updated python package versions to patch vulnerabilities

### Changed

- Standardized license headers across source files.

## [1.1.8] - 2024-12-17

### Security

- Updated node modules to patch vulnerabilities

### Fixed

- Disable button to download redacted documents when no entities are selected. This previously caused an error.

## [1.1.7] - 2024-11-18

### Security

- Updated node and python packages to patch vulnerabilities

### Fixed

- Search failure when deployed with exclusively with Amazon OpenSearch option

## [1.1.6] - 2024-10-31

### Security

- Updated node modules to patch vulnerabilities

## [1.1.5] - 2024-09-24

### Security

- Updated node modules to patch vulnerabilities

## [1.1.4] - 2024-09-17

### Security

- Updated node modules to patch vulnerabilities

## [1.1.3] - 2024-08-19

### Security

- Updated node modules to patch vulnerabilities

## [1.1.2] - 2024-08-01

### Security

- Updated node modules to patch vulnerabilities

## [1.1.1] - 2024-07-18

### Security

- Updated python packages to patch vulnerabilities

## [1.1.0] - 2024-07-03

### Changed

- Added OpenSearch support
- Backend bulk documents upload
- Pagination on loading cases page

### Security

- Updated node modules to patch vulnerabilities

## [1.0.12] - 2024-06-25

### Security

- Updated node modules to patch vulnerabilities

## [1.0.11] - 2024-06-17

### Security

- Updated node modules to patch vulnerabilities

## [1.0.10] - 2024-05-30

### Security

- Updated node modules to patch vulnerabilities

## [1.0.9] - 2024-05-16

### Changed

- Updated java runtime libraries to patch vulnerabilities

## [1.0.8] - 2024-05-14

### Fixed

- CSP response header name length longer than supported, causing stack failure in ap-southeast-1 and ap-south-east-2

## [1.0.7] - 2024-05-13

### Security

- Updated node modules to patch vulnerabilities

## [1.0.6] - 2024-03-27

### Security

- Updated node modules to patch vulnerabilities

### Fixed

- Fixed a bug in the entity detection code which caused failures on an edge case with repeating words ([issue 34](https://github.com/aws-solutions/enhanced-document-understanding-on-aws/issues/34))

### Changed

- Failure on a single entity now does not cause the whole workflow to fail, instead logging an error message and continuing

## [1.0.5] - 2024-03-05

### Changed

- Library upgrades to address security vulnerability related to `node-ip` [CVE-2023-42282](https://github.com/advisories/GHSA-78xj-cgh5-2h22)
- Add dependency between Amazon S3 bucket creation and S3 bucket policy to reduce failures with `Fn::GetAtt` when retrieving bucket arn to create bucket policy

## [1.0.4] - 2024-01-11

### Changed

- AWS CDK and SDK upgrades
- Fix an intermittent issue in AWS CloudFormation by setting explicit dependencies between resources

## [1.0.3] - 2023-12-07

### Changed

- Library upgrades to address security vulnerabilities.
- Fix an issue with sample workflow configurations where `textract` workflow was missing before any `entity` based detection workflow.
- Upgrade AWS Lambda runtimes to Python 3.12, Nodejs 20, and Java 21.
- Update AWS SDK and AWS CDK versions.

## [1.0.2] - 2023-11-09

### Changed

- AWS CDK and SDK version updates
- Library upgrades to address security vulnerabilities.

## [1.0.1] - 2023-10-18

### Changed

- Library upgrades to address security vulnerabilities

## [1.0.0] - 2023-08-30

### Added

- Initial Release
