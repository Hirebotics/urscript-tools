import { FilePattern, IBundleSources } from '../bundler/types';

export interface IURTesterCliConfig {
  controller: IControllerConfig;
  testServer: {
    host: string;
    port: number;
    defaultExecutionTimeout: number;
    restartThreshold?: number;
  };
  mocks: FilePattern;
  sources: IBundleSources;
}

export interface IURRunnerCliConfig {
  controller: IControllerConfig;
}

interface IControllerConfig {
  host: string;
  ports: {
    primary: number;
  };
  autoLaunch: {
    disabled: boolean;
    version: string;
    stop: boolean;
  };
}
