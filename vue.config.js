module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      externals: ['node-window-manager', 'iohook'],
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
