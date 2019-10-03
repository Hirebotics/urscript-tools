export interface IScriptRunnerConfig {
  host: string;
  port: number;
  controller: {
    autoLaunch: boolean;
    controllerVersion: string;
  };
}

export interface IScriptRunnerShutdownOptions {
  stopAutoLaunchedController?: boolean;
}

export interface IScriptRunner {
  send(script: string): Promise<void>;
  shutdown(options?: IScriptRunnerShutdownOptions): Promise<void>;
}
