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
