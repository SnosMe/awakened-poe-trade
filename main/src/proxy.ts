import type { Server } from 'http'
import * as https from 'https'
import { app } from 'electron'

export const PROXY_HOSTS = [
  { host: 'www.pathofexile.com', official: true },
  { host: 'ru.pathofexile.com', official: true },
  { host: 'web.poe.garena.tw', official: true },
  { host: 'poe.game.daum.net', official: true },
  { host: 'poe.ninja', official: false },
  { host: 'www.poeprices.info', official: false },
]

export class HttpProxy {
  cookiesForPoe = new Map<string, string>()

  constructor (
    server: Server
  ) {
    server.addListener('request', (req, res) => {
      if (!req.url?.startsWith('/proxy/')) return
      const host = req.url.split('/', 3)[2]

      const official = PROXY_HOSTS.find(entry => entry.host === host)?.official
      if (official === undefined) return req.destroy()

      const cookie = (official)
        ? Array.from(this.cookiesForPoe.entries())
            .map(([key, value]) => `${key}=${value}`)
            .join('; ')
        : ''

      const proxyReq = https.request(
        'https://' + req.url.slice('/proxy/'.length),
        {
          method: req.method,
          headers: {
            ...req.headers,
            host: host,
            cookie: cookie,
            'user-agent': app.userAgentFallback
          }
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode!, proxyRes.statusMessage!, proxyRes.rawHeaders)
          proxyRes.pipe(res)
        })
      req.pipe(proxyReq)
    })
  }
}
