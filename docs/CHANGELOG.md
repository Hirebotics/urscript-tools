## [1.7.2](https://github.com/Hirebotics/urscript-tools/compare/v1.7.1...v1.7.2) (2024-07-02)


### Bug Fixes

* force publish ([3c2a067](https://github.com/Hirebotics/urscript-tools/commit/3c2a067af02b76a6d08940a6b14ed51b9d0a9558))

## [1.7.1](https://github.com/Hirebotics/urscript-tools/compare/v1.7.0...v1.7.1) (2024-07-02)


### Bug Fixes

* force version bump ([acd55da](https://github.com/Hirebotics/urscript-tools/commit/acd55da4fdc211317dba839b682a5be6d2a0bc02))

# [1.7.0](https://github.com/Hirebotics/urscript-tools/compare/v1.6.1...v1.7.0) (2022-01-10)


### Bug Fixes

* fixed robot code error message ([5a48cdc](https://github.com/Hirebotics/urscript-tools/commit/5a48cdcd4d6c5e1d829e95ee5666cbb6bcfdee1e))


### Features

* support for failing test when error code received ([73d6475](https://github.com/Hirebotics/urscript-tools/commit/73d647592a6ba2d7fcf441db4c955334a6fa882e))

## [1.6.1](https://github.com/Hirebotics/urscript-tools/compare/v1.6.0...v1.6.1) (2021-09-30)


### Bug Fixes

* added TEST_HOST and TEST_PORT global variables ([5d9ac3f](https://github.com/Hirebotics/urscript-tools/commit/5d9ac3f68f404c41f81618b7dd0ec5514dbcf5f0))

# [1.6.0](https://github.com/Hirebotics/urscript-tools/compare/v1.5.0...v1.6.0) (2020-05-21)


### Bug Fixes

* extracted test injection code and added unit test ([61f0904](https://github.com/Hirebotics/urscript-tools/commit/61f0904eb83c002b6fdc7dca0282bede6bc18bd9))
* handle scenario where test name with a keyword would get malformed ([52e00f0](https://github.com/Hirebotics/urscript-tools/commit/52e00f07eb2a6f9f439729a0e3c84f12baee4d6a))
* mock regex to not replace when preceded by chars ([e1ce51e](https://github.com/Hirebotics/urscript-tools/commit/e1ce51ed4df175f77d4cdb5b70787a9550cb1458))
* removed bundle key requirement for non-dimensional bundles ([a79095f](https://github.com/Hirebotics/urscript-tools/commit/a79095f8924ddffef1379f8fd91e9960ddff2092))
* support deep merge on bundle service config ([921a5da](https://github.com/Hirebotics/urscript-tools/commit/921a5da6fdac06270ab9e2d8889e55274ff1d630))


### Features

* added support to strip comments when bundling ([3336b5b](https://github.com/Hirebotics/urscript-tools/commit/3336b5b7c6364751eef87b69f63fc738ead2cef4))

# [1.5.0](https://github.com/Hirebotics/urscript-tools/compare/v1.4.1...v1.5.0) (2020-05-20)


### Bug Fixes

* cleaned up socket after sending script commands ([7188b3d](https://github.com/Hirebotics/urscript-tools/commit/7188b3d05ae4c5734e165760757d4f793c756e1f))
* kill keepalive thread before shutting down runner ([259a3ed](https://github.com/Hirebotics/urscript-tools/commit/259a3ed683678a5c8a0c5fe1d08d135935c74844))


### Features

* added messages as result to run script ([1790d62](https://github.com/Hirebotics/urscript-tools/commit/1790d622f013e245ff1fccfbae28ab1d239f019f))
* moved core of runner cli into URScriptExecutor to allow reuse ([9a9d6c8](https://github.com/Hirebotics/urscript-tools/commit/9a9d6c829589e356ad49f3bc0106ca448630327b))
* running a script blocks until execution complete ([65c8713](https://github.com/Hirebotics/urscript-tools/commit/65c8713bb52e7eb7ab82a3199b0243f78786f875))
* updated to include types in package dist ([75db8e1](https://github.com/Hirebotics/urscript-tools/commit/75db8e1cdd752907ab0782b70737f29b0fc1dbf9))

## [1.4.1](https://github.com/Hirebotics/urscript-tools/compare/v1.4.0...v1.4.1) (2020-05-13)


### Bug Fixes

* fixed error if textmsg was invoked with a non-string data type ([d2d6f26](https://github.com/Hirebotics/urscript-tools/commit/d2d6f26fa4d622e88372069dbd7d4c5d21171a0c))

# [1.4.0](https://github.com/Hirebotics/urscript-tools/compare/v1.3.4...v1.4.0) (2020-05-12)


### Bug Fixes

* added Contextual error to message handler ([506d336](https://github.com/Hirebotics/urscript-tools/commit/506d336))


### Features

* added includeInfoMessages messages flag for script message handler ([6ad8508](https://github.com/Hirebotics/urscript-tools/commit/6ad8508))
* new urscript runner cli tool ([dff65d3](https://github.com/Hirebotics/urscript-tools/commit/dff65d3))

## [1.3.4](https://github.com/Hirebotics/urscript-tools/compare/v1.3.3...v1.3.4) (2020-04-15)


### Bug Fixes

* fixed conditional to execute correct number of test for threshold ([ac2cc71](https://github.com/Hirebotics/urscript-tools/commit/ac2cc71))

## [1.3.3](https://github.com/Hirebotics/urscript-tools/compare/v1.3.2...v1.3.3) (2020-04-15)


### Bug Fixes

* only reset primary port if we are shutting down instance ([e4867b4](https://github.com/Hirebotics/urscript-tools/commit/e4867b4))
* reset primary port in script runner ([ef532a2](https://github.com/Hirebotics/urscript-tools/commit/ef532a2))

## [1.3.2](https://github.com/Hirebotics/urscript-tools/compare/v1.3.1...v1.3.2) (2020-04-15)


### Bug Fixes

* added restart threshold as a band-aid to mitigate controller lockup ([78037bc](https://github.com/Hirebotics/urscript-tools/commit/78037bc))

## [1.3.1](https://github.com/Hirebotics/urscript-tools/compare/v1.3.0...v1.3.1) (2020-02-07)


### Bug Fixes

* forcefully throw error on a test failure ([be48500](https://github.com/Hirebotics/urscript-tools/commit/be48500))

# [1.3.0](https://github.com/Hirebotics/urscript-tools/compare/v1.2.5...v1.3.0) (2019-12-20)


### Bug Fixes

* changed mergeWith customizer to be anonymous ([b99b923](https://github.com/Hirebotics/urscript-tools/commit/b99b923))


### Features

* added support for test runner to leverage bundle config ([3fefe09](https://github.com/Hirebotics/urscript-tools/commit/3fefe09))

## [1.2.5](https://github.com/Hirebotics/urscript-tools/compare/v1.2.4...v1.2.5) (2019-11-02)


### Bug Fixes

* **urtester:** Improved test result formatting to use column auto widths and a cleaner result border ([48a7f02](https://github.com/Hirebotics/urscript-tools/commit/48a7f02))

## [1.2.4](https://github.com/Hirebotics/urscript-tools/compare/v1.2.3...v1.2.4) (2019-11-02)


### Bug Fixes

* **urtester:** Added support for more FilePattern on mock definitions ([50bcc01](https://github.com/Hirebotics/urscript-tools/commit/50bcc01))

## [1.2.3](https://github.com/Hirebotics/urscript-tools/compare/v1.2.2...v1.2.3) (2019-10-26)


### Bug Fixes

* **runner:** Fixed issue where dynamic ports weren't being created. Updated to query container port when running. ([58cca0f](https://github.com/Hirebotics/urscript-tools/commit/58cca0f))

## [1.2.2](https://github.com/Hirebotics/urscript-tools/compare/v1.2.1...v1.2.2) (2019-10-25)


### Bug Fixes

* **runner:** Exposed launch method to give more control to others on when the controller is launched. Fixes an issue where the test fail due to launch takes longer than execution timeout. ([8785c63](https://github.com/Hirebotics/urscript-tools/commit/8785c63))

## [1.2.1](https://github.com/Hirebotics/urscript-tools/compare/v1.2.0...v1.2.1) (2019-10-25)


### Bug Fixes

* **urtester:** Changed to run a container to lookup ip address ([5d95f69](https://github.com/Hirebotics/urscript-tools/commit/5d95f69))

# [1.2.0](https://github.com/Hirebotics/urscript-tools/compare/v1.1.0...v1.2.0) (2019-10-24)


### Bug Fixes

* **runner:** Added controller launch delay ([f7633b5](https://github.com/Hirebotics/urscript-tools/commit/f7633b5))
* **urtester:** Changed default mock pattern ([ae1d84b](https://github.com/Hirebotics/urscript-tools/commit/ae1d84b))


### Features

* **runner:** Added dynamic port support for script runner ([6af7ca7](https://github.com/Hirebotics/urscript-tools/commit/6af7ca7))
* **runner:** Added support for stopping container after execution ([321fd03](https://github.com/Hirebotics/urscript-tools/commit/321fd03))
* **urtester:** Added autodiscover docker host ([e3f5582](https://github.com/Hirebotics/urscript-tools/commit/e3f5582))
* **urtester:** New support for simple config with logical defaults ([9d6ea0e](https://github.com/Hirebotics/urscript-tools/commit/9d6ea0e))

# [1.1.0](https://github.com/Hirebotics/urscript-tools/compare/v1.0.0...v1.1.0) (2019-10-17)


### Features

* **build:** Bumping version to get new build process into clean state ([98b43f4](https://github.com/Hirebotics/urscript-tools/commit/98b43f4))

# 1.0.0 (2019-10-17)


### Features

* **build:** Added CI process to urscript-tools ([39c9447](https://github.com/Hirebotics/urscript-tools/commit/39c9447))
