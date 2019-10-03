import chalk from 'chalk';
import { table } from 'table';

import { ITestFile, ITestResult, ITestResultWriter } from './types';

export class TestResultWriter implements ITestResultWriter {
  public async writeResults(
    testFile: ITestFile,
    results: ITestResult[]
  ): Promise<void> {
    this.writeHeader(testFile, results);

    const data = results.map(r =>
      Object.keys(r).map(k => {
        let val = r[k];

        // replace control characters from val to prevent
        // error when printing table
        val = val.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        if (val === '') {
          return null;
        }

        if (k === 'status') {
          if (val === 'failed') {
            return chalk.red(val);
          } else {
            return chalk.green(val);
          }
        }

        if (r['status'] === 'failed' && k === 'message') {
          return chalk.yellow(val);
        }

        return val;
      })
    );

    const config = {
      columns: {
        0: {
          width: 50,
        },
        1: {
          width: 10,
        },
        2: {
          width: 60,
        },
      },
    };

    console.log(table(data, config));
  }

  private writeHeader(testFile: ITestFile, results: ITestResult[]): void {
    const { group, file } = testFile;
    const failed =
      results.findIndex(r => r.status === 'failed') > -1 ? true : false;

    const groupMessage = failed ? chalk.red(group) : chalk.yellow(group);

    console.log(`\n${groupMessage}`);
    console.log(`\n${file}`);
  }
}
