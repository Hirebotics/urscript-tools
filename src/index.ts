import { BundleService } from './bundler/BundleService';
import { IBundlerService, IBundles } from './bundler/types';

const service: IBundlerService = new BundleService({
  sources: {
    global: {
      scripts: {
        include: ['./src/**/*.ts'],
      },
    },
    dimensions: {
      ft: {
        ati: {
          scripts: {
            include: ['./src/**/__tests__/**/*.script'],
          },
        },
      },
      second: {
        another: {
          scripts: {
            include: ['*.js'],
          },
        },
        hello: {
          scripts: {
            include: ['*.js'],
          },
        },
      },
    },
  },
});

service.bundle([
  {
    dimensionKey: 'ft',
    variationKey: 'ati',
  },
  {
    dimensionKey: 'second',
    variationKey: 'another',
  },
]);

service.bundleAll();
