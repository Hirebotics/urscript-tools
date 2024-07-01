import * as glob from 'glob';
import { difference, isArray, mergeWith, uniq, reverse } from 'lodash';

import { FilePattern, IBundleSource } from '../bundler/types';

/**
 * Function returns all unique file paths found using the {FilePattern} provided.
 * File paths found with the excluded pattern will not be included in the return
 * value.
 *
 * @param {FilePattern} pattern
 */
export const getFilePaths = (pattern: FilePattern): Array<string> => {
  const { include, exclude } = pattern;

  const includedFiles = getFilesFromPatterns(include);
  const excludedFiles = getFilesFromPatterns(exclude);

  return difference(includedFiles, excludedFiles);
};

/**
 * Function returns an array of unique file names found with
 * the glob patterns provided
 *
 * @param {Array<string>} patterns Array of glob patterns
 */
export const getFilesFromPatterns = (
  patterns: Array<string> | undefined
): Array<string> => {
  let allFiles: Array<string> = [];

  if (patterns) {
    patterns.forEach(pattern => {
      allFiles = allFiles.concat(glob.sync(pattern));
    });
  }

  return uniq(allFiles);
};

/**
 * Function merges bundle source into one. It will deep merge
 * all properties including array and return a bundle source
 * with unique values
 *
 * @param {IBundleSource} source1
 * @param {IBundleSource} source2
 */
export const mergeBundleSource = (
  source1: IBundleSource,
  source2: IBundleSource
): IBundleSource => {
  return mergeWith(source1, source2, (objValue, srcValue) => {
    if (isArray(objValue, srcValue)) {
      return uniq(objValue.concat(srcValue));
    }
  });
};
