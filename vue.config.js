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
    },
    i18n: {
      enableInSFC: true
    }
  }
}
