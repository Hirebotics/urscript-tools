import * as fs from 'fs';
import { promisify } from 'util';

import { FilePattern } from '../bundler/types';
import { getFilePaths } from './BundleUtils';

const readFile = promisify(fs.readFile);

export class URTestUtils {
  public static async appendCodeFromFilePattern(
    baseCode: string,
    pattern: FilePattern
  ): Promise<string> {
    if (pattern) {
      const files = getFilePaths(pattern);

      let merged = baseCode;
      if (files) {
        for (let f of files) {
          const buffer = await readFile(f);
          const contents = buffer.toString();
          merged = this.appendCode(merged, `# ${f}\n\n${contents}`);
        }
      }

      return merged;
    }

    return baseCode;
  }

  public static appendCode(baseCode: string, codeToAppend: string) {
    return `${baseCode}\n${codeToAppend}\n`;
  }

  public static formatCode(code: string): string {
    let tabbedCode = code;

    if (tabbedCode) {
      // inject tabs into each line of modified script
      tabbedCode = tabbedCode
        .split('\n')
        .map((line) => `\t${line}`)
        .join('\n');
    }

    return tabbedCode;
  }

  public static appendTestCases(baseCode: string, testCode: string): string {
    const tests = URTestUtils.getTestDefinitions(testCode);

    let mergedCode: string = baseCode;

    if (tests) {
      const testLifecycleBeforeEach = URTestUtils.getDefinitionByRegex(
        testCode,
        /.*beforeEach\(/g
      );
      const testLifecycleAfterEach = URTestUtils.getDefinitionByRegex(
        testCode,
        /.*afterEach\(/g
      );

      const hasBeforeEach =
        testLifecycleBeforeEach && testLifecycleBeforeEach.length === 1
          ? true
          : false;

      const hasAfterEach =
        testLifecycleAfterEach && testLifecycleAfterEach.length === 1
          ? true
          : false;

      tests.forEach((test) => {
        let testExecutionCode = `
          test_framework_internal_beforeEach("${test}")
          ${hasBeforeEach ? 'beforeEach()' : ''}
          ${test}()
          ${hasAfterEach ? 'afterEach()' : ''}
          test_framework_internal_afterEach("${test}")
        `;

        testExecutionCode = testExecutionCode
          .split('\n')
          .map((line) => line.trim())
          .join('\n');

        mergedCode += `${testExecutionCode}`;
      });
    }

    return mergedCode;
  }

  public static replaceInvocationsWithMocks(
    baseCode: string,
    mockNames: string[]
  ): string {
    let mockedCode = baseCode;

    if (mockNames && mockNames.length > 0) {
      // replace function definition in the merged file with
      // the mock implementation function name

      for (const mock of mockNames) {
        // get the function name to override
        const overrideFunctionName = mock.replace(/mock\_/, '');

        // replace references of the override name in the merged script
        // with the mock function name

        mockedCode = mockedCode
          .split('\n')
          .map((line) => {
            let modified = line.trim();

            if (
              modified.startsWith('def') ||
              modified.startsWith('thread') ||
              modified.startsWith('#')
            ) {
              return line;
            }

            if (modified.indexOf(overrideFunctionName) > -1) {
              return line.replace(
                new RegExp(`(?<!_|[A-Za-z])${overrideFunctionName}\\(`, 'g'),
                `${mock}(`
              );
            }

            return line;
          })
          .join('\n');
      }
    }

    return mockedCode;
  }

  public static getMockDefinitions(testCode: string): string[] {
    return this.getDefinitionByRegex(testCode, /.*mock_.+\(/g);
  }

  public static getTestDefinitions(testCode: string): string[] {
    return this.getDefinitionByRegex(testCode, /.*def.*test_.+\(/g);
  }

  public static getDefinitionByRegex(
    code: string,
    regex: RegExp
  ): Array<string> {
    const results = code.match(regex);

    if (results) {
      return results
        .map((t) => t.trim())
        .filter((t) => !t.startsWith('#'))
        .map((t) => t.replace(/^(def|thread)[\s]*/g, '').replace('(', ''));
    }

    return [];
  }
}
