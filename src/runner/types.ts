export interface IScriptRunnerConfig {
  host: string;
  port: number;
  controller: {
    autoLaunch: boolean;
    autoStop: boolean;
    controllerVersion: string;
  };
}

export interface IScriptRunner {
  send(script: string): Promise<void>;
  shutdown(): Promise<void>;
}
