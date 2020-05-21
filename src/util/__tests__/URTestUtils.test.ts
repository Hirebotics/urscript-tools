import * as fs from 'fs';
import { promisify } from 'util';

import { FilePattern } from '../../bundler/types';
import { URTestUtils } from '../URTestUtils';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

describe('URTestUtils', () => {
  test('extract - tests', () => {
    const testCode = `
      def test_helloWorld():
      end
      def test_again():
      end
    `;

    const tests = URTestUtils.getTestDefinitions(testCode);

    expect(tests).toEqual(['test_helloWorld', 'test_again']);
  });

  test('extract - name includes keyword - def | thread', () => {
    const testCode = `
      def test_some_default_test():
      end

      def test_thread():
      end
    `;

    const tests = URTestUtils.getTestDefinitions(testCode);

    expect(tests).toEqual(['test_some_default_test', 'test_thread']);
  });

  test('append code - string', async () => {
    const baseCode: string = `
      # some code here
    `;

    const codeToAppend: string = `
      def mock_textmsg(msg1, msg2 = ""):
        # code
      end
    `;

    const expected: string = `${baseCode}\n${codeToAppend}\n`;

    const result: string = URTestUtils.appendCode(baseCode, codeToAppend);

    expect(result).toEqual(expected);
  });

  test('append code - file pattern', async () => {
    const file1: string = `/tmp/${Date.now()}`;
    const file2: string = `/tmp/${Date.now() + 1}`;

    const file1Contents: string = `
      def mock_one():
      end
    `;

    const file2Contents: string = `
      def mock_two():
      end
    `;

    await writeFile(file1, file1Contents);
    await writeFile(file2, file2Contents);

    const pattern: FilePattern = {
      include: [file1, file2],
    };

    const baseCode: string = `
      # some code here
    `;

    const result: string = await URTestUtils.appendCodeFromFilePattern(
      baseCode,
      pattern
    );

    await unlink(file1);
    await unlink(file2);

    expect(result).toContain(file1Contents);
    expect(result).toContain(file2Contents);
  });

  test('replace inovcations - mocks', async () => {
    const baseCode: string = `
      invocationToReplace()
      anotherFunction()
      helloWorld()
    `;

    const expected: string = `
      mock_invocationToReplace()
      anotherFunction()
      mock_helloWorld()
    `;

    const result: string = URTestUtils.replaceInvocationsWithMocks(baseCode, [
      'mock_invocationToReplace',
      'mock_helloWorld',
    ]);

    expect(result).toEqual(expected);
  });

  test('replace inovcations - mock name exist in another function name - https://github.com/Hirebotics/urscript-tools/issues/12', async () => {
    const baseCode: string = `
      hbmovel()
    `;

    const expected: string = `
      hbmovel()
    `;

    const result: string = URTestUtils.replaceInvocationsWithMocks(baseCode, [
      'mock_movel',
    ]);

    expect(result).toEqual(expected);
  });

  test('append test cases', async () => {
    const baseCode: string = `
      hbmovel()
    `;

    const testCode: string = `
      def test_hello():
      end
    `;

    const expected = `
      hbmovel()
      test_framework_internal_beforeEach("test_hello")
      test_hello()
      test_framework_internal_afterEach("test_hello")
    `;

    const result = URTestUtils.appendTestCases(baseCode, testCode);

    expect(result.replace(/\s/g, '')).toEqual(expected.replace(/\s/g, ''));
  });

  test('append test cases - before each / after each', async () => {
    const baseCode: string = `
      hbmovel()
    `;

    const testCode: string = `
      def beforeEach():
      end

      def afterEach():
      end

      def test_hello():
      end
    `;

    const expected = `
      hbmovel()
      test_framework_internal_beforeEach("test_hello")
      beforeEach()
      test_hello()
      afterEach()
      test_framework_internal_afterEach("test_hello")
    `;

    const result = URTestUtils.appendTestCases(baseCode, testCode);

    expect(result.replace(/\s/g, '')).toEqual(expected.replace(/\s/g, ''));
  });
});
