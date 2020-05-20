import { URTestUtils } from '../URTestUtils';

describe('URTestUtils', () => {
  test('extract - tests', () => {
    const testCode = `
      def test_helloWorld():
      end
      def test_again():
      end
    `;

    const tests = URTestUtils.extractTests(testCode);

    expect(tests).toEqual(['test_helloWorld', 'test_again']);
  });

  test('extract - name includes keyword - def | thread', () => {
    const testCode = `
      def test_some_default_test():
      end

      def test_thread():
      end
    `;

    const tests = URTestUtils.extractTests(testCode);

    expect(tests).toEqual(['test_some_default_test', 'test_thread']);
  });
});
