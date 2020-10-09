const withSourceMaps = require('@zeit/next-source-maps'); // see (1)

module.exports = withSourceMaps({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.node = {
        fs: 'empty' // see (2)
      };
    }
    return config;
  }
});

/*/ FOOTNOTES /////////////////////////////////////////////////////////////////

    (1) add source maps
    (2) fix npm packages that depend on 'fs' module
        via https://github.com/zeit/next.js/issues/7755#issuecomment-508633125
    (3) fix eslint resolver issues with monorepo
        via https://github.com/Dreamscapes/eslint-import-resolver-lerna

/*/ /////////////////////////////////////////////////////////////////////////*/
