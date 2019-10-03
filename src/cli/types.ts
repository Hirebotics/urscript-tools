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
