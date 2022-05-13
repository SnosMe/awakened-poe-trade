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

    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap((options) => {
        if (!options.compilerOptions) options.compilerOptions = {}
        options.compilerOptions.isCustomElement = (tag) => tag === 'webview'
        return options
      })
  }
}
