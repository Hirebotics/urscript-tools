import { readFileSync } from 'fs';
import { flatten } from 'lodash';
import { resolve } from 'path';

import { BundlerService } from '../bundler/BundlerService';
import { IBundle, IBundles } from '../bundler/types';
import { getFilesFromPatterns } from '../util/BundleUtils';
import { getDockerHost } from '../util/docker';
import { logger } from '../util/logger';
import { ITestExecutionConfig, ITestExecutionService, ITestFile, ITestResult } from './types';

export class TestExecutionService implements ITestExecutionService {
  private config: ITestExecutionConfig;

  private fileCache: {
    [key: string]: string;
  } = {};

  constructor(config: ITestExecutionConfig) {
    this.config = config;
  }

  public async execute(): Promise<Array<ITestResult>> {
    logger.info('starting test execution', {
      config: this.config,
    });

    // get all test files that we will execute
    const files: Array<string> = getFilesFromPatterns([
      this.config.test.pattern as string,
    ]);

    const bundler = new BundlerService(this.config.bundlerConfig);

    const bundles = await bundler.bundleAll();
    const promises = files.map(
      async file => await this.createTests(file, bundles)
    );

    const { writer } = this.config.results;
    const tests: Array<ITestFile> = flatten(await Promise.all(promises));

    let allResults: Array<ITestResult> = [];

    const { runner } = this.config;

    try {
      for (const test of tests) {
        const results: Array<ITestResult> = await runner.run(test);

        writer.writeResults(test, results);

        allResults = allResults.concat(results);
      }
    } finally {
      runner.stop();
    }

    return allResults;
  }

  private async createTests(
    testFile: string,
    bundles: IBundles
  ): Promise<Array<ITestFile>> {
    logger.info('creating tests for bundles', {
      testFile,
      bundles,
    });

    const tests = Object.values(bundles).map(bundle =>
      this.createTest(testFile, bundle)
    );

    return Promise.all(tests);
  }

  private async createTest(
    testFile: string,
    bundle: IBundle
  ): Promise<ITestFile> {
    const shared = await this.getFileContents(
      bundle.name,
      bundle.file as string
    );

    let testCode = await this.getFileContents(testFile, testFile);

    // take the test code and inject the global mocks definition code into it
    testCode = await this.injectGlobalMockDefinitions(testCode);

    let merged = shared;

    merged = await this.injectTestCode(merged, testCode);
    merged = await this.injectMockFunctions(merged, testCode);
    merged = await this.injectTestExecution(merged, testCode);
    merged = await this.injectIntoHarness(merged);

    return {
      code: merged,
      file: testFile,
      group: bundle.name,
    };
  }

  private async injectGlobalMockDefinitions(code: string): Promise<string> {
    const pattern: string | undefined = this.config.mocks.global;

    if (pattern) {
      const files = getFilesFromPatterns([pattern]);

      let merged = code;

      if (files) {
        files.forEach(f => {
          const mockDefinitions = readFileSync(f).toString();
          merged += `# ${f}\n\n${mockDefinitions}\n`;
        });
      }

      return merged;
    }

    return code;
  }

  private async injectTestCode(
    code: string,
    testCode: string
  ): Promise<string> {
    return `${code}\n\n${testCode}\n`;
  }

  private async injectMockFunctions(
    code: string,
    testCode: string
  ): Promise<string> {
    let mockedCode = code;

    const mocks = this.getDefinitionByRegex(testCode, /.*mock_.+\(/g);

    if (mocks && mocks.length > 0) {
      // replace function definition in the merged file with
      // the mock implementation function name

      for (const mock of mocks) {
        // get the function name to override
        const overrideFunctionName = mock.replace(/mock\_/, '');

        // replace references of the override name in the merged script
        // with the mock function name

        mockedCode = mockedCode
          .split('\n')
          .map(line => {
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
                new RegExp(`(?<!_)${overrideFunctionName}\\(`, 'g'),
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

  /**
   * Function injects the execution of each test wrapped with a beforeEach
   * and beforeAfter call if they are defined
   *
   * @param {*} code
   * @param {*} tests
   */
  private async injectTestExecution(
    code: string,
    testCode: string
  ): Promise<string> {
    const {
      server: { port },
    } = this.config.environment;

    const host: string = await this.getHost();

    logger.info('injecting environment config into script', {
      host,
      port,
    });

    let mergedCode = code;

    const tests = this.getDefinitionByRegex(testCode, /.*def.*test_.+\(/g);

    // append execute of each test below with a call to beforeEach if it exists
    if (tests) {
      const testLifecycleBeforeEach = this.getDefinitionByRegex(
        testCode,
        /.*beforeEach\(/g
      );
      const testLifecycleAfterEach = this.getDefinitionByRegex(
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

      mergedCode += `\ntest_framework_initialize("${host}", ${port})\n`;

      tests.forEach(test => {
        let testExecutionCode = `
          test_framework_internal_beforeEach("${test}")
          ${hasBeforeEach ? 'beforeEach()' : '# no before each block defined'}
          ${test}()
          ${hasAfterEach ? 'afterEach()' : '# no after each block defined'}
          test_framework_internal_afterEach("${test}")
        `;

        testExecutionCode = testExecutionCode
          .split('\n')
          .map(line => line.trim())
          .join('\n');

        mergedCode += `${testExecutionCode}`;
      });

      // add the internal after all invocation
      mergedCode += `test_framework_internal_afterAll()\n`;
    }

    return mergedCode;
  }

  private async injectFormatting(code: string): Promise<string> {
    let tabbedCode = code;

    if (tabbedCode) {
      // inject tabs into each line of modified script
      tabbedCode = tabbedCode
        .split('\n')
        .map(line => `\t${line}`)
        .join('\n');
    }

    return tabbedCode;
  }

  private async injectFramework(code: string): Promise<string> {
    const framework = await this.getFileContents(
      'framework',
      `${this.getTemplatesDir()}/framework.script`
    );

    return code.replace(
      /{{.*test_framework_code.*}}/,
      await this.injectFormatting(framework)
    );
  }

  private async injectIntoHarness(code: string): Promise<string> {
    let harness = await this.getFileContents(
      'harness',
      `${this.getTemplatesDir()}/harness.script`
    );

    harness = await this.injectFramework(harness);
    harness = harness.replace(
      /{{.*test_script_code.*}}/,
      await this.injectFormatting(code)
    );

    return harness;
  }

  private getDefinitionByRegex(code: string, regex: RegExp): Array<string> {
    const results = code.match(regex);

    if (results) {
      return results
        .map(t => t.trim())
        .filter(t => !t.startsWith('#'))
        .map(t => t.replace(/(def|thread)[\s]*/g, '').replace('(', ''));
    }

    return [];
  }

  private getTemplatesDir(): string {
    return resolve(__dirname, 'templates');
  }

  private async getHost(): Promise<string> {
    const {
      environment: {
        server: { host },
      },
    } = this.config;

    if (host === 'autodiscover') {
      return getDockerHost();
    } else {
      return host;
    }
  }

  /**
   * Helper function to get a files contents from a local cache before
   * reading directly from disk
   *
   * @param key
   * @param path
   */
  private async getFileContents(key: string, path: string): Promise<string> {
    let contents: string = this.fileCache[key];

    if (!contents) {
      contents = readFileSync(path as string).toString();
    }

    this.fileCache[key] = contents;

    return contents;
  }
}
