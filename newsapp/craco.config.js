module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        http: false,
        https: false,
        stream: false,
      };
      return config;
    },
  },
};
