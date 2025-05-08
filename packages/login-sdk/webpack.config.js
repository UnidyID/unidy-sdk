/**
 * Webpack configuration for the login-sdk package
 */

const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'unidy-login.min.js' : 'unidy-login.js',
      library: {
        name: 'UnidyLoginSDK',
        type: 'umd',
        export: 'default',
        umdNamedDefine: true
      },
      globalObject: 'this',
      clean: true
    },
    
    module: {
      rules: [
        // JavaScript/JSX files
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['last 2 versions', 'not dead', 'not ie <= 11']
                  }
                }]
              ]
            }
          }
        },
        // CSS files
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    
    resolve: {
      extensions: ['.js', '.json']
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    optimization: {
      minimize: isProduction
    },
    
    // Development server configuration
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 9000,
      hot: true,
      open: true
    },
    
    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 512000, // 500 KiB
      maxEntrypointSize: 512000 // 500 KiB
    }
  };
};