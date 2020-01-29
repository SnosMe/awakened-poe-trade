import x11, { Display, Atom, Window } from 'x11'
import async from 'async'
import { Rectangle } from 'electron'
import { IWindowManager } from './WindowManager'

export class LinuxX11 implements IWindowManager {
  private USED_ATOMS = {
    _NET_WM_NAME: 0,
    _NET_ACTIVE_WINDOW: 0,
    UTF8_STRING: 0,
    WINDOW: 0
  }

  private display!: Display

  private get X () { return this.display.client }

  private get rootWid () { return this.display.screen[0].root }

  static async createManager (): Promise<LinuxX11> {
    return new Promise((resolve, reject) => {
      const manager = new LinuxX11()

      async.waterfall([
        x11.createClient,
        function (display: Display, cb: any) {
          manager.display = display
          manager.USED_ATOMS.WINDOW = display.client.atoms.WINDOW
          manager.display.client.on('error', function () { /* */ })

          const X = display.client
          async.parallel([
            function (cb) { X.InternAtom(false, '_NET_WM_NAME', cb) },
            function (cb) { X.InternAtom(false, '_NET_ACTIVE_WINDOW', cb) },
            function (cb) { X.InternAtom(false, 'UTF8_STRING', cb) }
          ], cb)
        },
        function (res: Atom[], cb: any) {
          manager.USED_ATOMS._NET_WM_NAME = res[0]
          manager.USED_ATOMS._NET_ACTIVE_WINDOW = res[1]
          manager.USED_ATOMS.UTF8_STRING = res[2]
          cb(null)
        }
      ], (err) => {
        if (err) { reject(err) } else { resolve(manager) }
      })
    })
  }

  async getActiveWindowTitle (): Promise<string | null> {
    return new Promise((resolve, reject) => {
      async.waterfall([
        (cb: any) => {
          this.X.GetProperty(0, this.rootWid, this.USED_ATOMS._NET_ACTIVE_WINDOW, this.USED_ATOMS.WINDOW, 0, 4, cb)
        },
        (prop: any, cb: any) => {
          const activeWid = decodeWindow(prop.data)
          if (activeWid) {
            this.X.GetProperty(0, activeWid, this.USED_ATOMS._NET_WM_NAME, this.USED_ATOMS.UTF8_STRING, 0, 10000000, cb)
          } else {
            resolve(null)
          }
        },
        (prop: any, cb: any) => {
          cb(null, decodeUtf8String(prop.data))
        }
      ], (err, title?: string) => {
        if (err) { reject(err) } else { resolve(title!) }
      })
    })
  }

  async getActiveWindowContentBounds (): Promise<Rectangle | null> {
    return new Promise((resolve, reject) => {
      async.waterfall([
        (cb: any) => {
          this.X.GetProperty(0, this.rootWid, this.USED_ATOMS._NET_ACTIVE_WINDOW, this.USED_ATOMS.WINDOW, 0, 4, cb)
        },
        (prop: any, cb: any) => {
          const activeWid = decodeWindow(prop.data)
          if (activeWid) {
            let geom: x11.WindowGeometry
            async.waterfall([
              (cb: any) => {
                this.X.GetGeometry(activeWid, cb)
              },
              (geom_: any, cb: any) => {
                geom = geom_
                // @TODO verify geom.borderWidth is handled correctly
                this.X.TranslateCoordinates(activeWid, this.rootWid, geom.borderWidth, geom.borderWidth, cb)
              },
              (trans: x11.TranslatedCoordinates) => {
                // @TODO verify geom.borderWidth is handled correctly
                cb(null, {
                  x: trans.destX,
                  y: trans.destY,
                  width: geom.width,
                  height: geom.height
                } as Rectangle)
              }
            ], cb)
          } else {
            cb(null, null)
          }
        }
      ], (err: any, bounds?: Rectangle) => {
        if (err) { reject(err) } else { resolve(bounds) }
      })
    })
  }

  getActiveWindowId (): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.X.GetProperty(0, this.rootWid, this.USED_ATOMS._NET_ACTIVE_WINDOW, this.USED_ATOMS.WINDOW, 0, 4, (err, prop) => {
        if (err) {
          reject(err)
        } else {
          resolve(decodeWindow(prop.data))
        }
      })
    })
  }

  focusWindowById (id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error('Method not implemented.'))
    })
  }
}

function decodeWindow (data: Buffer): Window {
  return data.readUInt32LE(0)
}

function decodeUtf8String (data: Buffer) {
  return data.toString('utf8', 0)
}
