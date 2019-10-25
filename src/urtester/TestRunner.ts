import chalk from 'chalk';
import { createServer, Server, Socket } from 'net';

import { logger } from '../util/logger';
import { ITestFile, ITestResult, ITestRunner, ITestRunnerConfig } from './types';

enum IInternalTestMessageType {
  EXECUTION_STARTED = 'EXECUTION_STARTED',
  EXECUTION_RESULT = 'EXECUTION_RESULT',
  LOG_MESSAGE = 'LOG_MESSAGE',
  TEST_EXECUTION_TIMEOUT = 'TEST_EXECUTION_TIMEOUT',
  EXECUTION_COMPLETE = 'EXECUTION_COMPLETE',
}

interface IInternalTestMessage {
  type: IInternalTestMessageType;
  name?: string;
  message?: string;
  status?: string;
  timeout?: number;
}

export class TestRunner implements ITestRunner {
  private config: ITestRunnerConfig;

  private server: Server;
  private serverConnections: { [key: string]: Socket } = {};
  private executionTimeout: NodeJS.Timeout;

  private testResolve: (results: Array<ITestResult>) => void | undefined;
  private testReject: (reason: any) => void;

  private results: Array<ITestResult> = [];

  constructor(config: ITestRunnerConfig) {
    this.config = config;
    this.handleData = this.handleData.bind(this);
  }

  public async run(test: ITestFile): Promise<ITestResult[]> {
    const { runner } = this.config;

    // make sure runner is launched before starting result server
    await runner.launch();

    if (!this.isResultServerRunning()) {
      await this.startResultServer();
    }

    logger.info('running test', {
      file: test.file,
    });

    // send test file to the script runner
    await runner.send(test.code);

    // TODO - bad pattern here, but we don't know the test
    // is complete until the server receives an execution complete
    // callback
    return new Promise((resolve, reject) => {
      this.testResolve = resolve;
      this.testReject = reject;
    });
  }

  public async stop(): Promise<void> {
    logger.info('stopping test runner');

    const { runner } = this.config;

    if (this.server) {
      logger.info('closing client connections');
      Object.keys(this.serverConnections).forEach(k =>
        this.serverConnections[k].destroy()
      );
      this.server.close();
    }

    if (runner) {
      await runner.shutdown();
    }
  }

  private async testExecutionComplete(): Promise<void> {
    logger.info('test execution complete');
    this.clearExecutionTimeout();

    if (this.testResolve) {
      this.testResolve(this.results);
    }

    this.results = [];
  }

  private async startResultServer(): Promise<boolean> {
    logger.info('starting test result server');

    try {
      this.server = await this.createResultServer(this.handleData);
    } catch (err) {
      logger.error('failed to start test result server', {
        errorMessage: err.message,
      });
    }

    return false;
  }

  private async handlePacket(packet: string): Promise<void> {
    const { executionTimeout } = this.config;
    const message = this.extractMessageFromPacket(packet);

    if (message) {
      logger.debug('received message on result server', {
        result: message,
      });
      if (message.type === 'EXECUTION_STARTED') {
        this.startExecutionTimeout(executionTimeout);
      } else if (message.type === 'EXECUTION_RESULT') {
        this.startExecutionTimeout(executionTimeout);
        this.results.push({
          name: message.name as string,
          message: message.message as string,
          status: message.status as any,
        });
      } else if (message.type === 'LOG_MESSAGE') {
        // TODO extract and allow end user to provide implementation
        console.log(`${chalk.cyan('logger')}: ${message.message}`);
      } else if (message.type === 'TEST_EXECUTION_TIMEOUT') {
        this.startExecutionTimeout(message.timeout as number);
      } else if (message.type === 'EXECUTION_COMPLETE') {
        this.testExecutionComplete();
      }
    }
  }

  private extractMessageFromPacket(
    packet: string
  ): IInternalTestMessage | undefined {
    const pairs = packet.split('+++');

    if (pairs && pairs.length) {
      const obj = {};

      pairs.forEach(pair => {
        const split = pair.split('&&&');
        obj[split[0].trim()] = split[1];
      });

      return obj as IInternalTestMessage;
    } else {
      logger.error(`unable to parse packet - ${JSON.stringify(packet)}`);
    }
  }

  private isResultServerRunning(): boolean {
    if (this.server) {
      return this.server.listening;
    }

    return false;
  }

  private startExecutionTimeout(timeout: number): void {
    this.clearExecutionTimeout();

    this.executionTimeout = setTimeout(() => {
      this.testReject(`execution timed out - ${timeout}ms`);
    }, timeout);
  }

  private clearExecutionTimeout(): void {
    if (this.executionTimeout) {
      clearTimeout(this.executionTimeout);
    }
  }

  private async createResultServer(
    dataHandler: (data: string) => void
  ): Promise<Server> {
    const { port, executionTimeout } = this.config;

    return new Promise((resolve, reject) => {
      logger.info('creating result server');

      try {
        const connections = this.serverConnections;

        const server = createServer(socket => {
          socket.on('data', dataHandler);
        }).listen(port);

        // manage connections
        server.on('connection', function(conn: Socket) {
          const key = `${conn.remoteAddress}:${conn.remotePort}`;
          connections[key] = conn;
          conn.on('close', function() {
            delete connections[key];
          });
        });

        logger.info('result server created');

        this.startExecutionTimeout(executionTimeout);

        resolve(server);
      } catch (err) {
        reject(err);
      }
    });
  }

  private async handleData(data: string): Promise<void> {
    const packets = data.toString().split('$^');
    packets.filter(p => p !== '\n').forEach(p => this.handlePacket(p));
  }
}
