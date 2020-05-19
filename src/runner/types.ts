export interface IScriptRunnerConfig {
  host: string;
  port: number;
  controller: {
    autoLaunch: boolean;
    autoStop: boolean;
    controllerVersion: string;
  };
  messageHandler?: IURScriptMessageHandler;
}

export interface IScriptRunner {
  send(script: string): Promise<void>;
  launch(): Promise<boolean>;
  shutdown(kill?: boolean): Promise<void>;
  isRunning(): Promise<boolean>;
}

export interface IURScriptMessageHandlerConfig {
  throwExceptionOnError?: boolean;
  includeInfoMessages?: boolean;
}

export interface IURScriptMessageHandler {
  stdout(message: string): Promise<void>;
  stderr(message: string): Promise<void>;
}

export interface IScriptExecutorConfig {
  onLogMessage?: (message: string) => void;
}
