// via https://github.com/zeit/next.js/issues/7755#issuecomment-508633125
module.exports = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty'
      };
    }

    return config;
  }
};
