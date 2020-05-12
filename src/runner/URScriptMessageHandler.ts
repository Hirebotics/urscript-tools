import chalk from 'chalk';

import {
  IURScriptMessageHandler,
  IURScriptMessageHandlerConfig
} from './types';

export class URScriptMessageHandler implements IURScriptMessageHandler {
  private prefix = chalk.blue('urcontroller');
  private errorKeywords: string[] = [
    'Compile error',
    'Lexer exception',
    'Runtime error',
    'Syntax error',
  ];

  private config: IURScriptMessageHandlerConfig;

  constructor(config?: IURScriptMessageHandlerConfig) {
    this.config = {
      throwExceptionOnError: false,
      includeInfoMessages: false,
      ...config,
    };
  }

  public async stdout(message: string): Promise<void> {
    if (message !== '') {
      if (this.isError(message)) {
        console.log(`${this.prefix}: ${chalk.red(message)}`);

        if (this.config.throwExceptionOnError) {
          throw new Error(message);
        }
      } else if (
        message.indexOf('INFO') < 0 ||
        this.config.includeInfoMessages
      ) {
        console.log(`${this.prefix}: ${message}`);
      }
    }
  }

  public async stderr(message: string): Promise<void> {
    if (message !== '') {
      console.log(`stderr: ${chalk.red(message)}`);
    }
  }

  protected isError(message: string): boolean {
    const keyword: string | undefined = this.errorKeywords.find(
      keyword => message.indexOf(keyword) > -1
    );

    return keyword ? true : false;
  }
}
