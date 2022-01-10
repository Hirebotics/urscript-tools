import childProcess, { ChildProcessWithoutNullStreams } from 'child_process';
import getPort from 'get-port';
import { createConnection } from 'net';
import * as Rx from 'rxjs';
import { RTEClient } from '../client/rte/rte';
import { IRealtimeMessage } from '../client/rte/rte.types';
import { getDockerContainerId } from '../util/docker';
import { logger } from '../util/logger';
import {
  IScriptRunner,
  IScriptRunnerConfig,
  IURScriptMessageHandler,
} from './types';
import { URScriptMessageHandler } from './URScriptMessageHandler';

export class URScriptRunner implements IScriptRunner {
  private config: IScriptRunnerConfig;
  private logTail: ChildProcessWithoutNullStreams | undefined;
  private primaryPort: number | undefined;

  private rteClientInitialized: boolean;
  private rteClient: RTEClient;
  private rteClientSubscription: Rx.Subscription;
  private rteMessageSubject = new Rx.Subject<IRealtimeMessage>();

  constructor(config: IScriptRunnerConfig) {
    this.config = {
      messageHandler: new URScriptMessageHandler(),
      ...config,
    };
  }

  public async send(script: string): Promise<void> {
    const launched: boolean = await this.launch();

    if (!launched) {
      throw new Error('failed to auto launch controller');
    }

    await this.initializeRTEClient();

    if (!this.logTail) {
      await this.startLogMonitor();
    }

    await this.sendToController(script);
  }

  public getConfig(): IScriptRunnerConfig {
    return this.config;
  }

  public async launch(): Promise<boolean> {
    const {
      controller: { autoLaunch },
    } = this.config;

    const running = await this.isRunning();

    if (!running && autoLaunch) {
      const command: string = await this.getLaunchCommand();

      logger.info('auto launching controller', {
        command,
      });

      try {
        await childProcess.execSync(command);

        // delay for a few seconds after launching to give time for the
        // controller to launch
        return new Promise((resolve) => {
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
    } else {
      return true;
    }
  }

  public async shutdown(kill: boolean = false): Promise<void> {
    if (this.logTail) {
      logger.info('shutting down urcontroller log monitor');
      this.logTail.kill();
      this.logTail = undefined;
    }

    if (kill || this.config.controller.autoStop) {
      await this.stop();
      this.primaryPort = undefined;
    }
  }

  public async isRunning(): Promise<boolean> {
    const containerId = await this.getContainerId();

    if (containerId && containerId !== '') {
      return true;
    }

    return false;
  }

  public getRealtimeClientObservable(): Rx.Observable<IRealtimeMessage> {
    return this.rteMessageSubject.asObservable();
  }

  private async sendToController(script: string) {
    const { host } = this.config;

    if (!this.primaryPort) {
      this.primaryPort = await this.getRealtimePort();
    }

    return new Promise<void>((resolve, _reject) => {
      const socket = createConnection({
        host,
        port: this.primaryPort as number,
      });

      const commands = script.split('\n');

      socket.on('connect', () => {
        commands.forEach((command) => socket.write(`${command}\n`));
        socket.end();
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

    const messageHandler = this.config
      .messageHandler as IURScriptMessageHandler;

    this.logTail.stdout.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .forEach((message) => {
          messageHandler.stdout(message);
        });
    });

    this.logTail.stderr.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .forEach((message) => {
          messageHandler.stderr(message);
        });
    });
  }

  private async stop(): Promise<boolean> {
    const command: string | undefined = await this.getStopCommand();

    logger.debug('stopping auto launched controller', {
      command,
    });

    this.rteClientSubscription?.unsubscribe();

    if (this.rteClient) {
      await this.rteClient.disconnect();
    }

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

  private async initializeRTEClient(): Promise<void> {
    if (this.rteClientInitialized) {
      return;
    }

    const realtimePort = await this.getRealtimePort();

    this.rteClient = new RTEClient({
      host: this.config.host,
      port: realtimePort,
    });

    const observable = await this.rteClient.connect();
    this.rteClientSubscription = observable.subscribe((m) => {
      this.rteMessageSubject.next(m);
    });

    this.rteClientInitialized = true;
  }

  private async getRealtimePort(): Promise<number> {
    const containerId: string | undefined = await this.getContainerId();

    if (containerId) {
      const command:
        | string
        | undefined = `docker inspect --format="{{json .NetworkSettings.Ports }}" ${containerId}`;

      logger.debug('get realtime port', {
        command,
      });

      if (command) {
        try {
          const result = JSON.parse(
            await childProcess.execSync(command).toString()
          );
          return result['30001/tcp'][0].HostPort;
        } catch (err) {
          logger.error('error stopping controller', {
            config: this.config,
            errorMessage: err.message,
          });
        }
      }
    }

    return this.config.port;
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

    const primaryPort = await getPort({
      port,
      host: '0.0.0.0',
    });

    const secondaryPort: number = await getPort({
      port: 30002,
      host: '0.0.0.0',
    });

    const realtimePort: number = await getPort({
      port: 30003,
      host: '0.0.0.0',
    });

    const rtdePort: number = await getPort({
      port: 30004,
      host: '0.0.0.0',
    });

    logger.info('binding to ports', {
      primaryPort,
      secondaryPort,
      realtimePort,
      rtdePort,
    });

    return `docker run -d --privileged -p ${primaryPort}:30001 -p ${secondaryPort}:30002 -p ${realtimePort}:30003 -p ${rtdePort}:30004 ${image}`;
  }

  private async getStopCommand(): Promise<string | undefined> {
    const containerId: string | undefined = await this.getContainerId();

    if (containerId) {
      return `docker stop ${containerId}`;
    }
  }
}
