// (1) add source maps
const withSourceMaps = require('@zeit/next-source-maps');
// (2) fix npm packages that depend on 'fs' module
// via https://github.com/zeit/next.js/issues/7755#issuecomment-508633125
// (3) fix eslint resolver issues with monorepo
// via https://github.com/Dreamscapes/eslint-import-resolver-lerna

// see (1) for source maps
module.exports = withSourceMaps({
  webpack: (config, { isServer }) => {
    // see (2) for fs
    if (!isServer) {
      config.node = {
        fs: 'empty'
      };
    }

    return config;
  }
});
