import { readFileSync, writeFileSync } from 'fs';
import { flatten } from 'lodash';
import { resolve } from 'path';

import { BundlerService } from '../bundler/BundlerService';
import { FilePattern, IBundle, IBundles } from '../bundler/types';
import { getFilePaths, getFilesFromPatterns } from '../util/BundleUtils';
import { getDockerHost } from '../util/docker';
import { logger } from '../util/logger';
import { URTestUtils } from '../util/URTestUtils';
import {
  ITestExecutionConfig,
  ITestExecutionService,
  ITestFile,
  ITestResult
} from './types';

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
      async (file) => await this.createTests(file, bundles)
    );

    const { writer } = this.config.results;
    const tests: Array<ITestFile> = flatten(await Promise.all(promises));

    let allResults: Array<ITestResult> = [];

    const { runner } = this.config;

    try {
      for (const test of tests) {
        const results: Array<ITestResult> = await runner.run(test);

        writer.writeResults(test, results);

        for (const result of results) {
          if (result.status === 'failed') {
            throw new Error('test failed');
          }
        }

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

    const tests = Object.values(bundles).map((bundle) =>
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
    testCode = await URTestUtils.appendCodeFromFilePattern(
      testCode,
      this.config.mocks
    );

    let merged = shared;

    merged = URTestUtils.appendCode(merged, testCode);
    merged = URTestUtils.replaceInvocationsWithMocks(
      merged,
      URTestUtils.getMockDefinitions(testCode)
    );

    merged = await this.injectTestExecution(merged, testCode);
    merged = await this.injectIntoHarness(merged);

    // write test to disk
    if (bundle.dir) {
      writeFileSync(`${bundle.dir}/test.script`, merged);
    }

    return {
      code: merged,
      file: testFile,
      group: bundle.name,
    };
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

    mergedCode += `\ntest_framework_initialize("${host}", ${port})\n`;
    mergedCode = URTestUtils.appendTestCases(mergedCode, testCode);
    mergedCode += `test_framework_internal_afterAll()\n`;

    return mergedCode;
  }

  private async injectFramework(code: string): Promise<string> {
    const framework = await this.getFileContents(
      'framework',
      `${this.getTemplatesDir()}/framework.script`
    );

    return code.replace(
      /{{.*test_framework_code.*}}/,
      URTestUtils.formatCode(framework)
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
      URTestUtils.formatCode(code)
    );

    return harness;
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
