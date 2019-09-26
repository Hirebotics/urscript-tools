import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { cloneDeep } from 'lodash';
import * as mkdirp from 'mkdirp';
import moment from 'moment';
import * as path from 'path';

import { getFilePaths, mergeBundleSource } from '../util/BundleUtils';
import { logger } from '../util/logger';
import {
    IBundle, IBundleDimension, IBundleDimensionFilter, IBundlerConfig, IBundlerService, IBundles,
    IBundleSource
} from './types';

type IBundlerConfigInternal = Required<IBundlerConfig>;

interface IBundlePermutations {
  [key: string]: {
    dimensions: Array<string>;
    source: IBundleSource;
  };
}

export class BundleService implements IBundlerService {
  private config: IBundlerConfigInternal = {
    sources: {
      dimensions: {},
      global: {},
    },
    options: {
      appendGitCommitHash: true,
      bundleKey: 'default',
      outputDir: 'bundle-dist',
      writeToDisk: true,
      scriptSuffix: 'script',
      bundleOutputFile: 'default',
    },
  };

  constructor(config: IBundlerConfig) {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  public async bundleAll(): Promise<IBundles> {
    logger.info('generating all bundles', {
      config: this.config,
    });

    const { sources } = this.config;

    let dimensions: IBundleDimension[] = Object.keys(
      sources.dimensions || []
    ).map(key => sources.dimensions![key]);

    return this.createBundles(dimensions);
  }

  public async bundle(
    filters: Array<IBundleDimensionFilter>
  ): Promise<IBundles | null> {
    const { dimensions } = this.config.sources;

    if (dimensions && filters) {
      const filteredDimensions: Array<IBundleDimension> = [];

      filters.forEach(filter => {
        filteredDimensions.push({
          [filter.variationKey]:
            dimensions[filter.dimensionKey][filter.variationKey],
        });
      });

      return this.createBundles(filteredDimensions);
    } else {
      logger.warn('unable to generate bundle by filter. no dimensions found', {
        config: this.config,
        filters,
      });
    }

    return null;
  }

  private createBundles(dimensions: Array<IBundleDimension>): IBundles {
    logger.info('creating bundles');

    const permutations = this.getBundlePermutations(dimensions);

    const bundles: IBundles = {};
    const hasPermutations =
      permutations && Object.keys(permutations).length > 0;

    const {
      sources: { global },
    } = this.config;

    if (!hasPermutations) {
      const defaultBundleKey = this.config.options.bundleKey as string;
      if (global && defaultBundleKey) {
        bundles[defaultBundleKey] = this.createBundle(defaultBundleKey, global);
      }
    } else if (permutations) {
      Object.keys(permutations).forEach(key => {
        const permutation = permutations[key];
        const { source } = permutation;
        bundles[key] = this.createBundle(
          key,
          mergeBundleSource(source, global || {})
        );
      });
    } else {
      logger.info('no permutations found to generate bundles');
    }

    const { options } = this.config;

    if (bundles && options.writeToDisk) {
      this.writeBundlesToDisk(bundles);
    }

    return bundles;
  }

  /**
   * Extract writing to custom service that provides hooks for creating header, etc.
   *
   * @param bundles
   */
  private async writeBundlesToDisk(bundles: IBundles): Promise<void> {
    const {
      options: {
        outputDir,
        appendGitCommitHash,
        scriptSuffix,
        bundleOutputFile,
      },
    } = this.config;

    // create parent directory

    Object.keys(bundles).forEach(bundleKey => {
      const bundle: IBundle = bundles[bundleKey];

      const dir = `${outputDir}/${bundleKey}`;

      mkdirp.sync(dir);

      const filename = path.resolve(
        __dirname,
        '../..',
        dir as string,
        `${bundleOutputFile}.${scriptSuffix}`
      );

      logger.info('writing bundle to disk', {
        bundleKey,
        filename,
      });

      const time: string = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');

      let contents = `# Generated ${time}\n# ${bundleKey}\n`;

      bundle.sources.forEach(file => {
        contents += '# **********************************************\n';
        contents += `# Scripts from file ${file} \n`;
        contents += '# **********************************************\n\n';
        contents += readFileSync(file).toString();
        contents += '\n\n';
      });

      bundle.assets.forEach(asset => {
        this.copyAssets(asset, dir);
      });

      writeFileSync(filename, contents);
    });
  }

  private copyAssets(source, dest) {
    logger.info('copying assets', {
      source,
      dest,
    });

    execSync(`cp ${source} ${dest}`);
  }

  private createBundle(name: string, source: IBundleSource): IBundle {
    return {
      name,
      assets: getFilePaths(source.assets || {}),
      sources: getFilePaths(source.scripts || {}),
    };
  }

  /**
   * Function recursively traverses bundle dimensions to create
   * all permutations of bundles. During this process the bundle
   * source is combined so that the final representation includes
   * all source files required to generate the bundle
   *
   * @param dimensions
   * @param source
   * @param permutations
   * @param prefix
   * @param keyDelimiter
   */
  private getBundlePermutations(
    dimensions: Array<IBundleDimension>,
    source: IBundleSource = {},
    permutations: IBundlePermutations = {},
    prefix: string = '',
    keyDelimiter: string = `-`
  ): IBundlePermutations {
    if (dimensions.length > 0) {
      const dimension: IBundleDimension = dimensions[0];

      if (dimensions && dimensions.length > 1) {
        Object.keys(dimension).forEach(key => {
          const path: string =
            prefix === '' ? key : `${prefix}${keyDelimiter}${key}`;
          this.getBundlePermutations(
            dimensions.slice(1),
            mergeBundleSource(cloneDeep(source), dimension[key]),
            permutations,
            path
          );
        });
      } else {
        Object.keys(dimension).forEach(key => {
          const fullKey: string = prefix
            ? `${prefix}${keyDelimiter}${key}`
            : key;
          permutations[fullKey] = {
            dimensions: fullKey.split(keyDelimiter),
            source: mergeBundleSource(cloneDeep(source), dimension[key]),
          };
        });
      }
    }

    return permutations;
  }
}
