var nodeExternals = require('webpack-node-externals');
module.exports = {
  entry: './index.js',
  output: 'create-pkg.js',
  mode: 'production',
  target: 'node', // important in order not to bundle built-in modules like path, fs, etc.
  externals: [nodeExternals({
      // this WILL include `jquery` and `webpack/hot/dev-server` in the bundle, as well as `lodash/*`
      whitelist: ['mustache', 'fs-extra', 'inquirer', 'nodegit']
  })]
};
