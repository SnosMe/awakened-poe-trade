import type { IpcEvent, IpcEventPayload } from '@ipc/types'

class HostTransport {
  private evBus = new EventTarget()
  private socket: WebSocket

  constructor () {
    this.socket = new WebSocket(`ws://${window.location.host}/events`)
    this.socket.addEventListener('message', (e) => {
      this.selfDispatch(JSON.parse(e.data))
    })
  }

  selfDispatch (event: IpcEvent) {
    this.evBus.dispatchEvent(new CustomEvent(event.name, {
      detail: event.payload
    }))
  }

  sendEvent (event: IpcEvent) {
    this.socket.send(JSON.stringify(event))
  }

  onEvent<Name extends IpcEvent['name']> (
    name: Name,
    cb: (payload: IpcEventPayload<Name>) => void
  ): AbortController {
    const controller = new AbortController()
    if (!this.isElectron && name.startsWith('MAIN->OVERLAY')) {
      return controller
    }

    this.evBus.addEventListener(name, (e) => {
      cb((e as CustomEvent<IpcEventPayload<Name>>).detail)
    }, { signal: controller.signal })
    return controller
  }

  async getConfig (): Promise<string | null> {
    const response = await fetch('/config')
    const config = await response.json() as { contents: string | null }
    return config.contents
  }

  async importFile (file: File): Promise<string> {
    const response = await fetch(`/uploads/${file.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file
    })
    const body = await response.json() as { name: string }
    return body.name
  }

  proxy: typeof window['fetch'] = async (url, init) => {
    return await window.fetch(`/proxy/${url as string}`, init)
  }

  get isElectron () {
    return navigator.userAgent.includes('awakened-poe-trade')
  }
}

export const MainProcess = new HostTransport()
export const Host = MainProcess
