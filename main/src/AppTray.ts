import path from 'path'
import { app, Tray, Menu, shell, nativeImage, dialog } from 'electron'
import type { ServerEvents } from './server'

export class AppTray {
  public overlayKey = 'Shift + Space'
  private tray: Tray
  serverPort = 0

  constructor (server: ServerEvents) {
    this.tray = new Tray(
      nativeImage.createFromPath(path.join(__dirname, process.env.STATIC!, process.platform === 'win32' ? 'icon.ico' : 'icon.png'))
    )
    this.tray.setToolTip(`Awakened PoE Trade Simplified Chinese v${app.getVersion()}`)
    this.rebuildMenu()

    server.onEventAnyClient('CLIENT->MAIN::user-action', ({ action }) => {
      if (action === 'quit') {
        app.quit()
      }
    })
  }

  rebuildMenu () {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '设置',
        click: () => {
          dialog.showMessageBox({
            title: 'Settings',
            message: `Open Path of Exile and press "${this.overlayKey}". Click on the button with cog icon there.`
          })
        }
      },
      {
        label: '浏览器打开界面',
        click: () => {
          shell.openExternal(`http://localhost:${this.serverPort}`)
        }
      },
      { type: 'separator' },
      {
        label: '打开配置文件目录',
        click: () => {
          shell.openPath(path.join(app.getPath('userData'), 'apt-data'))
        }
      },
      { type: 'separator' },
      {
        label: '支持原作者',
        click: () => {
          shell.openExternal('https://patreon.com/awakened_poe_trade')
        }
      },
      {
        label: '支持简中作者',
        click: () => {
          shell.openExternal('https://afdian.net/a/APTSimplifiedChinese/plan')
        }
      },
      { type: 'separator' },
      {
        label: 'KOOK(原开黑啦)流放之路频道',
        click: () => {
          shell.openExternal('https://www.kookapp.cn/app/channels/2724791411633812')
        }
      },
      {
        label: 'QQ流放之路频道',
        click: () => {
          shell.openExternal('https://qun.qq.com/qqweb/qunpro/share?appChannel=share&inviteCode=1XW9B3zlwiq#/pc')
        }
      },
      {
        label: '简中查价器交流群(QQ群)',
        click: () => {
          shell.openExternal('https://jq.qq.com/?_wv=1027&k=kDLAex8W')
        }
      },
      { type: 'separator' },
      {
        label: 'Discord (需要翻墙)',
        submenu: [
          {
            label: 'TFT(国际服常用频道)',
            click: () => { shell.openExternal('https://discord.gg/KNpmhvk') }
          },
          {
            label: 'POE频道',
            click: () => { shell.openExternal('https://discord.gg/fSwfqN5') }
          }
        ]
      },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }
}
