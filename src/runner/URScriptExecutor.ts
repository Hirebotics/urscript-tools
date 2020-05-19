import * as fs from 'fs';
import getPort from 'get-port';
import { merge } from 'lodash';
import * as net from 'net';
import * as path from 'path';

import { getDockerHost } from '../util/docker';
import { IScriptExecutorConfig, IScriptRunner } from './types';
import { URScriptRunner } from './URScriptRunner';

export class URScriptExecutor {
  private config: Required<IScriptExecutorConfig> = {
    onLogMessage: console.log,
  };

  private runner: IScriptRunner;
  private connections: net.Socket[] = [];
  private executionTimeout;
  private server: net.Server | undefined;

  private serverHost: string;
  private serverPort: number;

  private runResolve: () => void;
  private runReject: (err: Error) => void;

  constructor(runner: URScriptRunner, config?: IScriptExecutorConfig) {
    this.runner = runner;

    if (config) {
      merge(this.config, config);
    }
  }

  public async run(script: string): Promise<void> {
    if (!this.server) {
      await this.createServer();
    }

    const wrappedScript: string = this.createScript(
      script,
      this.serverHost,
      this.serverPort
    );

    this.startExecutionTimeout(2000);

    return new Promise((resolve, reject) => {
      this.runResolve = resolve;
      this.runReject = reject;
      this.runner.send(wrappedScript);
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }

    if (this.runner) {
      await this.runner.shutdown();
    }
  }

  private async createServer(): Promise<void> {
    this.serverHost = await getDockerHost();
    this.serverPort = await getPort();

    this.server = await this.startServer(this.serverPort, () => {
      if (this.runResolve) {
        this.runResolve();
      }
    });
  }

  private createScript(script: string, host: string, port: number): string {
    const formattedScript = script
      .split('\n')
      .map((l) => `\t${l}`)
      .join('\n');

    const harnessFile: string = path.resolve(
      __dirname,
      '../runner/templates/harness.script'
    );

    let finalScript = fs.readFileSync(harnessFile).toString();

    finalScript = finalScript.replace(
      '{{ startup }}',
      `runner_initialize("${host}", ${port})`
    );

    finalScript = finalScript.replace('{{ script_code }}', formattedScript);
    finalScript = finalScript.replace(/textmsg/g, 'runner_log_message');

    return finalScript;
  }

  private startExecutionTimeout(timeout: number): void {
    this.clearExecutionTimeout();

    this.executionTimeout = setTimeout(() => {
      if (this.runReject) {
        this.runReject(new Error('execution timed out'));
      }
    }, timeout);
  }

  private clearExecutionTimeout(): void {
    if (this.executionTimeout) {
      clearTimeout(this.executionTimeout);
    }
  }

  private async startServer(
    port: number,
    onExecutionStopped: () => void
  ): Promise<net.Server> {
    const { onLogMessage } = this.config;

    const server = await this.createScriptServer(port, (data) => {
      const packets = data.toString().split('$^');
      packets
        .filter((p) => p !== '\n')
        .forEach((p) => {
          const message = this.extractMessageFromPacket(p);
          if (message) {
            const { type } = message;
            if (type === 'LOG_MESSAGE') {
              onLogMessage(message.message);
            } else if (type === 'KEEP_ALIVE') {
              this.clearExecutionTimeout();
            } else if (type === 'EXECUTION_STOPPED') {
              this.connections.forEach((c) => c.end());
              onExecutionStopped();
            }
          }
        });
    });
    return server;
  }

  private createScriptServer(
    port: number,
    dataHandler: (data: string) => void
  ): Promise<net.Server> {
    return new Promise((resolve, reject) => {
      try {
        const server = net
          .createServer((socket) => {
            socket.on('data', dataHandler);
          })
          .listen(port);

        server.on('connection', (conn: net.Socket) => {
          const key = `${conn.remoteAddress}:${conn.remotePort}`;
          this.connections[key] = conn;
          conn.on('close', () => {
            delete this.connections[key];
            conn.end();
          });
        });

        resolve(server);
      } catch (err) {
        reject(err);
      }
    });
  }

  private extractMessageFromPacket(packet: string): any {
    const pairs = packet.split('+++');

    if (pairs && pairs.length) {
      const obj = {};

      pairs.forEach((pair) => {
        const split = pair.split('&&&');
        obj[split[0].trim()] = split[1];
      });

      return obj;
    }
  }
}
