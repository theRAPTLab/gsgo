// (1) add source maps
const withSourceMaps = require('@zeit/next-source-maps');
// (2) fix npm packages that depend on 'fs' module
// via https://github.com/zeit/next.js/issues/7755#issuecomment-508633125

module.exports = withSourceMaps({
  webpack: (config, { isServer }) => {
    // (1)
    if (!isServer) {
      config.node = {
        fs: 'empty'
      };
    }

    return config;
  }
});
