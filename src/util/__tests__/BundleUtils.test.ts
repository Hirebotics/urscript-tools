import 'jest';

import { FilePattern, IBundleSource } from '../../bundler/types';
import { getFilePaths, getFilesFromPatterns, mergeBundleSource } from '../BundleUtils';

describe('file path tests', () => {
  const rootFolder = 'src/util/__tests__/path';

  const filePatterns: FilePattern = {
    include: [`${rootFolder}/**/*.script`, `${rootFolder}/folder2/**/*.script`],
    exclude: [`${rootFolder}/**/__tests__/*`],
  };

  const defaultExpected = [
    `${rootFolder}/folder1/file1.script`,
    `${rootFolder}/folder1/file2.script`,
    `${rootFolder}/folder2/__tests__/newtest.test.script`,
    `${rootFolder}/folder2/file3.script`,
  ];

  test('getFilesFromPatterns', () => {
    const result = getFilesFromPatterns(filePatterns.include);
    expect(result).toEqual(defaultExpected);
  });

  test('getFilesFromPatterns - duplicate', () => {
    // create duplicate patterns and validate we didn't end up with duplicate
    // file paths
    const duplicatePatterns = filePatterns.include!.concat(
      filePatterns.include as Array<string>
    );

    const result = getFilesFromPatterns(duplicatePatterns);
    expect(result).toEqual(defaultExpected);
  });

  test('getFilePaths - exclude', () => {
    const result = getFilePaths(filePatterns);
    const expected = [
      `${rootFolder}/folder1/file1.script`,
      `${rootFolder}/folder1/file2.script`,
      `${rootFolder}/folder2/file3.script`,
    ];

    expect(result).toEqual(expected);
  });
});

describe('merge tests', () => {
  test('merge bundle sources', () => {
    const source1: IBundleSource = {
      assets: {
        include: ['src/assets/folder1', 'duplicate'],
        exclude: ['src/assets/exclude1'],
      },
      scripts: {
        include: ['src/scripts/scripts1'],
        exclude: ['src/exclude/scripts1'],
      },
    };

    const source2: IBundleSource = {
      assets: {
        include: ['src/assets/folder2', 'duplicate'],
        exclude: ['src/assets/exclude2'],
      },
      scripts: {
        include: ['src/scripts/scripts2'],
        exclude: ['src/exclude/scripts2'],
      },
    };

    const result: IBundleSource = mergeBundleSource(source1, source2);
    const expected: IBundleSource = {
      assets: {
        include: ['src/assets/folder1', 'duplicate', 'src/assets/folder2'],
        exclude: ['src/assets/exclude1', 'src/assets/exclude2'],
      },
      scripts: {
        include: ['src/scripts/scripts1', 'src/scripts/scripts2'],
        exclude: ['src/exclude/scripts1', 'src/exclude/scripts2'],
      },
    };

    expect(result).toEqual(expected);
  });
});
