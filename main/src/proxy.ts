import type { Server } from 'http'
import { app, net } from 'electron'
import type { Logger } from './RemoteLogger'
import { exec } from 'child_process';

const PROXY_HOSTS = [
  { host: 'www.pathofexile.com', official: true },
  { host: 'ru.pathofexile.com', official: true },
  { host: 'pathofexile.tw', official: true },
  { host: 'poe.game.daum.net', official: true },
  { host: 'poe.ninja', official: false },
  { host: 'www.poeprices.info', official: false },
  { host: 'kvan.dev', official: false },
]

export class HttpProxy {
  constructor (
    server: Server,
    logger: Logger
  ) {
    server.addListener('request', (req, res) => {
      if (!req.url?.startsWith('/proxy/')) return
      const fullPath = req.url.slice('/proxy/'.length)
      const host = req.url.split('/', 3)[2]

      if (fullPath.startsWith('www.pathofexile.com/api/trade2/search/Standard') || fullPath.startsWith('kvan.dev')) {
        this.executeCurl(fullPath, logger)
      }

      const official = PROXY_HOSTS.find(entry => entry.host === host)?.official
      if (official === undefined) return req.destroy()
      
      this.pingHost(host, logger);  // Add this line to use ping
      
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
        useSessionCookies: true
      })
      proxyReq.addListener('response', (proxyRes) => {
        logger.write(`response [proxy] ${proxyRes.statusCode} ${proxyRes.statusMessage} (${host})`)
        const resHeaders = { ...proxyRes.headers }
        delete resHeaders['content-encoding']
        res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, resHeaders)
        ;(proxyRes as unknown as NodeJS.ReadableStream).pipe(res)
      })
      proxyReq.addListener('error', (err) => {
        logger.write(`error [proxy] ${err.message} (${host})`)
        logger.write(`error-[proxy]-(${err.name}) ${err.stack}`)
        res.destroy(err)
      })

      req.pipe(proxyReq as unknown as NodeJS.WritableStream)
      
      logger.write(`Full request details: ${JSON.stringify(proxyReq, null, 2)}`);
    })
  }

  pingHost(host: string, logger: Logger) {
    const pingCommand = process.platform === 'win32' ? `ping -n 1 ${host}` : `ping -c 1 ${host}`;
    exec(pingCommand, (error, stdout, stderr) => {
      if (error) {
        logger.write(`ping error [${host}] ${error.message}`)
        return;
      }
      if (stderr) {
        logger.write(`ping stderr [${host}] ${stderr}`)
        return;
      }
      logger.write(`ping success [${host}] ${stdout}`)
    })
  }
  executeCurl(path: string, logger: Logger) {
    const postData = {
      "query": {
        "status": { "option": "online" },
        "stats": [{ "type": "and", "filters": [] }],
        "filters": {
          "trade_filters": { "filters": { "collapse": { "option": "true" }}},
          "type_filters": { "filters": {
            "rarity": { "option": "nonunique" },
            "category": { "option": "accessory.ring" }}},
          "misc_filters": { "filters": {
            "corrupted": { "option": "false" },
            "mirrored": { "option": "false" }}}
        }
      },
      "sort": { "price": "asc" }
    };
  
    const postDataStr = JSON.stringify(postData);
    const curlCommand = `curl -X POST --data '${postDataStr}' https://${path}`;
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        logger.write(`curl error [${path}] ${error.message}`);
        return;
      }
      if (stderr) {
        logger.write(`curl stderr [${path}] ${stderr}`);
        return;
      }
      logger.write(`curl output [${path}] ${stdout}`);
    });
  }
}
