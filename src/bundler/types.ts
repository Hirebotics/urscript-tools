export interface IBundlerConfig {
  sources?: IBundleSources;
  options?: {
    bundleKey?: string;
    bundleOutputFile?: string;
    outputDir?: string;
    writeToDisk?: boolean;
    scriptSuffix?: string;
    stripComments?: boolean;
  };
}

export interface IBundlerService {
  bundle(filters: Array<IBundleDimensionFilter>): Promise<IBundles | null>;
  bundleAll(): Promise<IBundles>;
}

export interface IBundleSources {
  global?: IBundleSource;
  dimensions?: IBundleDimensions;
}

export interface IBundle {
  name: string;
  dir?: string;
  file?: string;
  sources: Array<string>;
  assets: Array<string>;
}

export interface IBundles {
  [bundleKey: string]: IBundle;
}

export interface IBundleDimensions {
  [dimensionKey: string]: IBundleDimension;
}

export interface IBundleDimension {
  [variationKey: string]: IBundleSource;
}

export interface IBundleDimensionFilter {
  dimensionKey: string;
  variationKey: string;
}

export interface IBundleSource {
  assets?: FilePattern;
  scripts?: FilePattern;
}

export type FilePattern = {
  include?: Array<string>;
  exclude?: Array<string>;
};
