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
      logger.write(`Incoming request to proxy: ${req.url}`); // Log incoming request

      const official = PROXY_HOSTS.find(entry => entry.host === host)?.official
      if (official === undefined) {
        logger.write(`Host not officially supported: ${host}`);
        return req.destroy() // Log rejection on unsupported host
      }

      // Log headers before modifying them
      logger.write(`Incoming request headers: ${JSON.stringify(req.headers)}`);
      
      for (const key in req.headers) {
        if (key.startsWith('sec-') || key === 'host' || key === 'origin' || key === 'content-length') {
          delete req.headers[key]
        }
      }

      const url = req.url.slice('/proxy/'.length);
      const proxyReq = net.request({
        url: 'https://' + url,
        method: req.method,
        headers: {
          ...req.headers,
          'user-agent': app.userAgentFallback
        },
        useSessionCookies: true
      })

      proxyReq.addListener('response', (proxyRes) => {
        const resHeaders = { ...proxyRes.headers }
        // Log response status and headers
        logger.write(`Proxy response status: ${proxyRes.statusCode}, status message: ${proxyRes.statusMessage}`);
        logger.write(`Proxy response headers: ${JSON.stringify(resHeaders)}`);

        delete resHeaders['content-encoding']
        res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, resHeaders)
        ;(proxyRes as unknown as NodeJS.ReadableStream).pipe(res)
      })

      proxyReq.addListener('error', (err) => {
        logger.write(`Error during proxy request: ${err.message} (${host}); is this a network error?`);
        res.writeHead(502, 'Bad Gateway');
        res.end(`Proxy error: ${err.message}`);
      })

      req.pipe(proxyReq as unknown as NodeJS.WritableStream);
    })
  }
}