const path = require('path');

module.exports = function (options, webpack) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        '@generated': path.resolve(__dirname, 'generated'),
      },
    },
    // No marcar como externo, webpack debe poder resolver el alias
  };
};
