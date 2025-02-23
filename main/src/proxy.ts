import type { Server } from 'http'
import { app, net } from 'electron'
import type { Logger } from './RemoteLogger'

const PROXY_HOSTS = [
  { host: 'www.pathofexile.com', official: true },
  { host: 'ru.pathofexile.com', official: true },
  { host: 'pathofexile.tw', official: true },
  { host: 'poe.game.daum.net', official: true },
  { host: 'poe.ninja', official: false },
  { host: 'www.poeprices.info', official: false },
]

export class HttpProxy {
  constructor (
    server: Server,
    logger: Logger
  ) {
    server.addListener('request', (req, res) => {
      if (!req.url?.startsWith('/proxy/')) return
      const host = req.url.split('/', 3)[2]

      const official = PROXY_HOSTS.find(entry => entry.host === host)?.official
      if (official === undefined) return req.destroy()

      for (const key in req.headers) {
        if (key.startsWith('sec-') || key === 'host' || key === 'origin' || key === 'content-length') {
          delete req.headers[key]
        }
      }

      const proxyReq = net.request({
        url: 'https://' + req.url.slice('/proxy/'.length),
        method: req.method,
        headers: {
          ...req.headers,
          'user-agent': app.userAgentFallback
        },
        useSessionCookies: true,
        referrerPolicy: 'no-referrer-when-downgrade'
      })
      proxyReq.addListener('response', (proxyRes) => {
        const resHeaders = { ...proxyRes.headers }
        // `net.request` returns an already decoded body
        delete resHeaders['content-encoding']
        res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, resHeaders)
        ;(proxyRes as unknown as NodeJS.ReadableStream).pipe(res)
      })
      proxyReq.addListener('error', (err) => {
        logger.write(`error [cors-proxy] ${err.message} (${host})`)
        res.destroy(err)
      })
      req.pipe(proxyReq as unknown as NodeJS.WritableStream)
    })
  }
}
