#! /usr/bin/env node

import * as fs from 'fs';
import getPort from 'get-port';
import { merge } from 'lodash';
import minimist from 'minimist';
import * as net from 'net';
import * as path from 'path';

import { IScriptRunnerConfig } from '../runner/types';
import { URScriptMessageHandler } from '../runner/URScriptMessageHandler';
import { URScriptRunner } from '../runner/URScriptRunner';
import { getDockerHost } from '../util/docker';
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

  const host = await getDockerHost();
  const port = await getPort();

  const script = await createScript(files[0], host, port);

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

  const runner = new URScriptRunner(runnerConfig);

  const server = await startServer(port, () => {
    runner.shutdown();
  });

  await runner.send(script);

  startExecutionTimeout(2000);

  process.on('unhandledRejection', err => {
    server.close();
    runner.shutdown();

    throw err;
  });
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

const createScript = async (
  filePath: string,
  host: string,
  port: number
): Promise<string> => {
  const file = fs
    .readFileSync(filePath)
    .toString()
    .split('\n')
    .map(l => `\t${l}`)
    .join('\n');

  const harnessFile: string = path.resolve(
    __dirname,
    '../runner/templates/harness.script'
  );
  let script = fs.readFileSync(harnessFile).toString();

  script = script.replace(
    '{{ startup }}',
    `runner_initialize("${host}", ${port})`
  );

  script = script.replace('{{ script_code }}', file);
  script = script.replace(/textmsg/g, 'runner_log_message');

  return script;
};

const connections: net.Socket[] = [];
let executionTimeout;

const startExecutionTimeout = (timeout: number): void => {
  clearExecutionTimeout();

  executionTimeout = setTimeout(() => {
    throw new Error('execution timed out');
  }, timeout);
};

const clearExecutionTimeout = (): void => {
  if (executionTimeout) {
    clearTimeout(executionTimeout);
  }
};

const startServer = async (
  port: number,
  onExecutionStopped: () => void
): Promise<net.Server> => {
  const server = await createScriptServer(port, data => {
    const packets = data.toString().split('$^');
    packets
      .filter(p => p !== '\n')
      .forEach(p => {
        const message = extractMessageFromPacket(p);
        if (message) {
          const { type } = message;
          if (type === 'LOG_MESSAGE') {
            console.log(message.message);
          } else if (type === 'KEEP_ALIVE') {
            clearExecutionTimeout();
          } else if (type === 'EXECUTION_STOPPED') {
            connections.forEach(c => c.end());
            server.close();
            onExecutionStopped();
          }
        }
      });
  });
  return server;
};

const createScriptServer = (
  port: number,
  dataHandler: (data: string) => void
): Promise<net.Server> => {
  return new Promise((resolve, reject) => {
    try {
      const server = net
        .createServer(socket => {
          socket.on('data', dataHandler);
        })
        .listen(port);

      server.on('connection', function(conn: net.Socket) {
        const key = `${conn.remoteAddress}:${conn.remotePort}`;
        connections[key] = conn;
        conn.on('close', function() {
          delete connections[key];
          conn.end();
        });
      });

      resolve(server);
    } catch (err) {
      reject(err);
    }
  });
};

const extractMessageFromPacket = (packet: string): any => {
  const pairs = packet.split('+++');

  if (pairs && pairs.length) {
    const obj = {};

    pairs.forEach(pair => {
      const split = pair.split('&&&');
      obj[split[0].trim()] = split[1];
    });

    return obj;
  }
};

main();
