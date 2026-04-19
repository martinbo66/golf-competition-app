const webpack = require('webpack');

module.exports = {
  publicPath: './',
  outputDir: 'dist',
  assetsDir: 'assets',
  lintOnSave: process.env.NODE_ENV !== 'production',
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __BUILD_DATE__: JSON.stringify(
          new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        ),
        __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || 'dev')
      })
    ],
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    },
    performance: {
      hints: false
    }
  },
  devServer: {
    port: 8080,
    open: true,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true,
        logLevel: 'debug'
      }
    }
  }
};

