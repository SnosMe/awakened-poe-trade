module.exports = {
  publicPath: (process.env.NODE_ENV === 'production')
    ? 'app://./'
    : '/',
  chainWebpack: (config) => {
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
      .loader('@intlify/vue-i18n-loader')
      .end()
  }
}
