import { IBundleSources } from '../bundler/types';

export interface IURTesterCliConfig {
  controller: {
    host: string;
    ports: {
      realtime: number;
    };
    autoLaunch: {
      disabled: boolean;
      version: string;
      stop: boolean;
    };
  };
  testServer: {
    host: string;
    port: number;
    defaultExecutionTimeout: number;
  };
  mocks: {
    global: string;
  };
  sources: IBundleSources;
}
