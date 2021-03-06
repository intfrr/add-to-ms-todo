const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const YamlLocalesWebpackPlugin = require('yaml-locales-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const WebpackExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const merge = require('webpack-merge');
const resolve = require('path').resolve;
const webpack = require('webpack');

const manifest = require('./src/manifest.json');
const pkg = require('./package.json');

module.exports = (env, argv) => {
  const config = {
    entry: {
      background: './src/background.js',
      popup: './src/popup/popup.js',
      options: './src/options/options.js',
      log: './src/log/log.js'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      },
      extensions: ['.js', '.vue', '.json']
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        },
        {
          test: /\.s[ac]ss$/i,
          use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 10000
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new Dotenv(),
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: 'src/popup/popup.html',
        chunks: ['popup']
      }),
      new HtmlWebpackPlugin({
        filename: 'options.html',
        template: 'src/options/options.html',
        chunks: ['options']
      }),
      new HtmlWebpackPlugin({
        filename: 'log.html',
        template: 'src/log/log.html',
        chunks: ['log']
      }),
      new CopyPlugin([
        { from: 'src/icons', to: 'icons' },
        { from: 'src/assets', to: 'assets' }
      ]),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new YamlLocalesWebpackPlugin({
        messageAdditions: argv.beta ? { extName: ' (beta)' } : {}
      }),
      new VueLoaderPlugin(),
      new webpack.ProgressPlugin()
    ]
  };

  if (argv.mode === 'production') {
    return merge(
      {
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                output: {
                  comments: false
                }
              },
              extractComments: false
            }),
            new OptimizeCSSAssetsPlugin({})
          ]
        },
        plugins: [
          new WebpackExtensionManifestPlugin({
            config: {
              base: manifest,
              extend: { version: pkg.version }
            }
          })
        ]
      },
      config
    );
  } else {
    // development mode
    const dotEnv = new Dotenv();

    return merge(config, {
      plugins: [
        new WebpackExtensionManifestPlugin({
          config: {
            base: manifest,
            extend: {
              version: pkg.version,
              key: dotEnv.definitions['process.env.EXTENSION_KEY'].replace(
                /"/g,
                ''
              )
            }
          }
        })
      ],
      devtool: 'inline-source-map'
    });
  }
};
