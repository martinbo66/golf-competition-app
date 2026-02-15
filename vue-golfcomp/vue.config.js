module.exports = {
  publicPath: './',
  outputDir: 'dist',
  assetsDir: 'assets',
  lintOnSave: process.env.NODE_ENV !== 'production',
  productionSourceMap: false,
  configureWebpack: {
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
    historyApiFallback: true
  }
};

