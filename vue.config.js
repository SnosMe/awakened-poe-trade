module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      externals: ['electron-overlay-window', 'uiohook-napi'],
      builderOptions: {
        publish: ['github'],
        productName: 'Awakened PoE Trade',
        npmRebuild: false,
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true
        },
        win: {
          target: ['nsis', 'portable']
        },
        linux: {
          target: ['AppImage']
        }
      }
    }
  },
  configureWebpack: {
    resolve: {
      fallback: {
        path: false,
        fs: false
      }
    }
  },
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
