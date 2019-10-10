#! /usr/bin/env node

import { readFileSync } from 'fs';
import minimist from 'minimist';
import { extname } from 'path';

import { IBundlerConfig } from '../bundler/types';
import { IScriptRunnerConfig } from '../runner/types';
import { URScriptRunner } from '../runner/URScriptRunner';
import { TestExecutionService } from '../urtester/TestExecutionService';
import { TestResultWriter } from '../urtester/TestResultWriter';
import { TestRunner } from '../urtester/TestRunner';
import { ITestExecutionConfig, ITestExecutionService, ITestRunnerConfig } from '../urtester/types';
import { logger } from '../util/logger';
import { IURTesterCliConfig } from './types';

const printHelp = () => {
  console.log(
    'Usage: npx urscript-tester [--bundle <config.json>] [--controller-host host] [--controller-port port] [--controller-version version] [--test-host] [--test-port] [path]'
  );
  console.log('Tool used to generate unique script bundles');
  console.log('Options:');
  console.log('--config Configuration file');
  console.log('Expression (glob format) used to determine tests to execute');
};

const getTestPattern = pattern => {
  if (pattern) {
    const ext = extname(pattern);
    if (ext) {
      return `${pattern}*`;
    } else {
      const suffixPattern = '**/*.test.script';
      if (pattern.lastIndexOf('/') === pattern.length - 1) {
        return `${pattern}${suffixPattern}`;
      } else {
        return `${pattern}/${suffixPattern}`;
      }
    }
  }

  return '**/*.test.script';
};

const main = async () => {
  const args = minimist(process.argv.slice(2));

  // get args from cli
  const { _: path, config: configFilename } = args;

  if (!configFilename) {
    printHelp();
    process.exit(0);
  }

  const contents: string = readFileSync(configFilename).toString();

  try {
    const config: IURTesterCliConfig = JSON.parse(contents);

    logger.debug('urtest-cli launched with config', {
      config,
    });

    const bundlerConfig: IBundlerConfig = {
      sources: config.sources,
      options: {
        bundleKey: 'test-harness',
        bundleOutputFile: 'default',
        outputDir: '.urscript-test',
        scriptSuffix: 'script',
        writeToDisk: true,
      },
    };

    const scriptRunnerConfig: IScriptRunnerConfig = {
      host: config.controller.host,
      port: config.controller.ports.realtime,
      controller: {
        autoLaunch: !config.controller.autoLaunch.disabled,
        controllerVersion: config.controller.autoLaunch.version,
      },
    };

    const testRunnerConfig: ITestRunnerConfig = {
      runner: new URScriptRunner(scriptRunnerConfig),
      port: config.testServer.port,
      executionTimeout: config.testServer.defaultExecutionTimeout || 10000,
    };

    const executionConfig: ITestExecutionConfig = {
      runner: new TestRunner(testRunnerConfig),
      environment: {
        server: {
          host: config.testServer.host,
          port: config.testServer.port,
        },
      },
      test: {
        pattern: getTestPattern(path[0]),
      },
      mocks: {
        global: config.mocks.global || '__mocks__/**/*.mock.script',
      },
      bundlerConfig,
      results: {
        writer: new TestResultWriter(),
      },
    };

    const executor: ITestExecutionService = new TestExecutionService(
      executionConfig
    );

    await executor.execute();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

main();