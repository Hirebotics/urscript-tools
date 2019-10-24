import chalk from 'chalk';
import childProcess, { ChildProcessWithoutNullStreams } from 'child_process';
import { createConnection } from 'net';

import { getDockerContainerId } from '../util/docker';
import { logger } from '../util/logger';
import { IScriptRunner, IScriptRunnerConfig } from './types';

export class URScriptRunner implements IScriptRunner {
  private config: IScriptRunnerConfig;
  private logTail: ChildProcessWithoutNullStreams | undefined;

  constructor(config: IScriptRunnerConfig) {
    this.config = config;
  }

  public async send(script: string): Promise<void> {
    const {
      controller: { autoLaunch },
    } = this.config;

    const running = await this.isRunning();

    if (!running && autoLaunch) {
      const launched: boolean = await this.launch();

      if (!launched) {
        throw new Error('failed to auto launch controller');
      }
    }

    if (!this.logTail) {
      await this.startLogMonitor();
    }

    await this.sendToController(script);
  }

  public async shutdown(): Promise<void> {
    if (this.logTail) {
      logger.info('shutting down urcontroller log monitor');
      this.logTail.kill();
      this.logTail = undefined;
    }

    if (this.config.controller.autoStop) {
      await this.stop();
    }
  }

  private async sendToController(script: string) {
    const { host, port } = this.config;

    return new Promise((resolve, reject) => {
      const socket = createConnection({
        host,
        port,
      });

      const commands = script.split('\n');

      socket.on('connect', () => {
        commands.forEach(command => socket.write(`${command}\n`));
        resolve();
      });
    });
  }

  private async startLogMonitor(): Promise<void> {
    if (this.logTail !== undefined) {
      logger.info('log monitor already started');
      return;
    }

    const containerId = await this.getContainerId();

    const command: string = 'docker';
    const args = ['logs', '--follow', '--since', '0m', containerId];

    logger.debug('starting log monitor', {
      command,
      args,
    });

    this.logTail = childProcess.spawn(command, args as any);

    const prefix = chalk.blue('urcontroller');

    this.logTail.stdout.on('data', data => {
      data
        .toString()
        .split('\n')
        .filter(line => line !== '' && line.indexOf('INFO') < 0)
        .forEach(line => console.log(`${prefix}: ${line}`));
    });

    this.logTail.stderr.on('data', data => {
      data
        .toString()
        .split('\n')
        .forEach(line => console.log(`${prefix}: ${chalk.red(line)}`));
    });
  }

  private async launch(): Promise<boolean> {
    const command: string = await this.getLaunchCommand();

    logger.debug('auto launching controller', {
      command,
    });

    try {
      await childProcess.execSync(command);

      // delay for a few seconds after launching to give time for the
      // controller to launch
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
    } catch (err) {
      logger.error('error launching controller', {
        config: this.config,
        errorMessage: err.message,
      });
    }

    return false;
  }

  private async stop(): Promise<boolean> {
    const command: string | undefined = await this.getStopCommand();

    logger.debug('stopping auto launched controller', {
      command,
    });

    if (command) {
      try {
        await childProcess.execSync(command);
        return true;
      } catch (err) {
        logger.error('error stopping controller', {
          config: this.config,
          errorMessage: err.message,
        });
      }
    }

    return false;
  }

  private async isRunning(): Promise<boolean> {
    const containerId = await this.getContainerId();

    if (containerId && containerId !== '') {
      return true;
    }

    return false;
  }

  private async getContainerId(): Promise<string | undefined> {
    const image = await this.getDockerImageName();
    return getDockerContainerId(image);
  }

  private async getDockerImageName(): Promise<string> {
    return `hirebotics/ursim:${this.config.controller.controllerVersion}`;
  }

  private async getLaunchCommand(): Promise<string> {
    const image: string = await this.getDockerImageName();
    const { port } = this.config;

    return `docker run -d --privileged -p ${port}:30001 ${image}`;
  }

  private async getStopCommand(): Promise<string | undefined> {
    const image: string = await this.getDockerImageName();
    const containerId: string | undefined = await this.getContainerId();

    if (containerId) {
      return `docker stop ${containerId}`;
    }
  }
}
