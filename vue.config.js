module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      externals: ['node-window-manager', 'uiohook-napi'],
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
  }
}
