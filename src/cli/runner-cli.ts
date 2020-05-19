#! /usr/bin/env node

import * as fs from 'fs';
import { merge } from 'lodash';
import minimist from 'minimist';

import { IScriptRunnerConfig } from '../runner/types';
import { URScriptExecutor } from '../runner/URScriptExecutor';
import { URScriptMessageHandler } from '../runner/URScriptMessageHandler';
import { URScriptRunner } from '../runner/URScriptRunner';
import { IURRunnerCliConfig } from './types';

const defaultConfig: IURRunnerCliConfig = {
  controller: {
    host: 'localhost',
    autoLaunch: {
      disabled: false,
      stop: false,
      version: '5.8.0',
    },
    ports: {
      primary: 30001,
    },
  },
};

const main = async () => {
  const args = minimist(process.argv.slice(2));

  const { _: files, config: configFile } = args;

  const cliConfig = getRunnerCliConfig(configFile);

  const runnerConfig: IScriptRunnerConfig = {
    host: cliConfig.controller.host,
    port: cliConfig.controller.ports.primary,
    controller: {
      autoLaunch: !cliConfig.controller.autoLaunch.disabled,
      controllerVersion: cliConfig.controller.autoLaunch.version,
      autoStop: cliConfig.controller.autoLaunch.stop,
    },
    messageHandler: new URScriptMessageHandler({
      throwExceptionOnError: true,
    }),
  };

  const executor = new URScriptExecutor(new URScriptRunner(runnerConfig));

  const file = fs.readFileSync(files[0]).toString();

  await executor.run(file);
};

const getRunnerCliConfig = (configFile?: string): IURRunnerCliConfig => {
  const config: IURRunnerCliConfig = defaultConfig;

  try {
    const file: string = configFile || 'runner.config.json';

    if (file && fs.existsSync(file)) {
      const contents = JSON.parse(fs.readFileSync(file).toString());
      merge(defaultConfig, contents);
    }
  } catch (err) {
    console.error('unable to create config', {
      configFile,
    });
  }

  return config;
};

main();
