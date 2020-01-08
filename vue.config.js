module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: ['node-window-manager', 'iohook'],
      builderOptions: {
        publish: ['github'],
        productName: 'Awakened PoE Trade',
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true
        }
        // win: {
        //   requestedExecutionLevel: 'requireAdministrator'
        // }
      }
    }
  }
}
