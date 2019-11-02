import { FilePattern, IBundlerConfig } from '../bundler/types';
import { IScriptRunner } from '../runner/types';

export interface ITestExecutionConfig {
  runner: ITestRunner;
  test: {
    pattern: string;
  };
  mocks: FilePattern;
  bundlerConfig: IBundlerConfig;
  environment: {
    server: {
      host: string;
      port: number;
    };
  };
  results: {
    writer: ITestResultWriter;
  };
}

export interface ITestFile {
  file: string;
  code: string;
  group: string;
}

export interface ITestResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
}

export interface ITestResultWriter {
  writeResults(test: ITestFile, results: ITestResult[]): Promise<void>;
}

export interface ITestExecutionService {
  execute(): Promise<Array<ITestResult>>;
}

export interface ITestRunnerConfig {
  runner: IScriptRunner;
  port: number;
  executionTimeout: number;
}

export interface ITestRunner {
  run(test: ITestFile): Promise<ITestResult[]>;
  stop(): Promise<void>;
}
