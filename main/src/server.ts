import fastify from 'fastify'
import fastifyWs from '@fastify/websocket'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import type { WebSocket } from 'ws'
import type { AddressInfo } from 'net'
import { EventEmitter } from 'events'
import { app } from 'electron'
import { IpcEvent, IpcEventPayload, HostState } from '../../ipc/types'
import { ConfigStore } from './host-files/ConfigStore'
import { addFileUploadRoutes } from './host-files/file-uploads'
import type { AppUpdater } from './AppUpdater'

export const server = fastify()
let lastActiveClient: WebSocket

server.register(fastifyWs, {
  options: {}
})
server.register(fastifyCors, {
  origin: '*'
})

server.addContentTypeParser(
  'application/octet-stream',
  { parseAs: 'buffer' },
  (req, body, done) => { done(null, body) }
)

addFileUploadRoutes(server)

if (!process.env.VITE_DEV_SERVER_URL) {
  server.register(fastifyStatic, {
    root: __dirname,
    prefix: '/',
    decorateReply: false
  })
}

const evBus = new EventEmitter()

export function onEventAnyClient<Name extends IpcEvent['name']> (
  name: Name,
  cb: (payload: IpcEventPayload<Name>) => void
) {
  evBus.on(name, cb)
}

export function sendEventTo (
  target: 'last-active' | 'any' | 'broadcast',
  event: IpcEvent
) {
  const msg = JSON.stringify(event)
  if (target === 'broadcast') {
    for (const client of server.websocketServer.clients) {
      client.send(msg)
    }
  } else {
    lastActiveClient.send(msg)
  }
}

export interface ServerEvents {
  onEventAnyClient: typeof onEventAnyClient
  sendEventTo: typeof sendEventTo
}
export const eventPipe = {
  onEventAnyClient,
  sendEventTo
}

server.register(async (instance) => {
  instance.get('/events', { websocket: true }, (connection) => {
    lastActiveClient = connection.socket
    connection.socket.on('message', (bytes) => {
      const event = JSON.parse(bytes.toString('utf-8')) as IpcEvent
      if (event.name === 'CLIENT->MAIN::used-recently') {
        lastActiveClient = connection.socket
      }
      evBus.emit(event.name, event.payload)
    })
    connection.socket.on('close', () => {
      const clients = server.websocketServer.clients
      if (clients.size === 1) {
        lastActiveClient = clients.values().next().value
        evBus.emit('CLIENT->MAIN::used-recently', { isOverlay: true })
      }
    })
  })
})

export async function startServer (
  appUpdater: AppUpdater
): Promise<number> {
  const configStore = new ConfigStore(eventPipe)

  server.get<{
    Reply: HostState
  }>('/config', async (_req) => {
    return {
      version: app.getVersion(),
      portable: Boolean(process.env.PORTABLE_EXECUTABLE_DIR),
      updater: appUpdater.info,
      contents: await configStore.load()
    }
  })

  let port = (process.env.VITE_DEV_SERVER_URL) ? 8584 : 0
  let host = 'localhost'
  // --listen=[host][:port]
  const listenOpt = process.argv.find(arg => arg.startsWith('--listen'))
  if (listenOpt) {
    const [hostArg, portArg] = listenOpt.split('=')[1].split(':')
    if (hostArg) host = hostArg
    if (portArg) port = parseInt(portArg, 10)
  }

  await server.listen({ port, host })
  return (server.server.address() as AddressInfo).port
}
