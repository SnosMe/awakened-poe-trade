import type { FastifyInstance } from 'fastify'
import fastifyProxy from '@fastify/http-proxy'
import { app } from 'electron'

export const PROXY_HOSTS = [
  { host: 'www.pathofexile.com', official: true },
  { host: 'ru.pathofexile.com', official: true },
  { host: 'web.poe.garena.tw', official: true },
  { host: 'poe.ninja', official: false },
  { host: 'www.poeprices.info', official: false },
]

export class HttpProxy {
  cookiesForPoe = new Map<string, string>()

  constructor (
    server: FastifyInstance
  ) {
    for (const { host, official } of PROXY_HOSTS) {
      server.register(fastifyProxy, {
        upstream: `https://${host}`,
        prefix: `/proxy/${host}`,
        replyOptions: {
          rewriteRequestHeaders: (_, headers) => {
            const cookie = (official)
              ? Array.from(this.cookiesForPoe.entries())
                  .map(([key, value]) => `${key}=${value}`)
                  .join('; ')
              : undefined

            return {
              ...headers,
              cookie,
              'user-agent': app.userAgentFallback
            }
          }
        }
      })
    }
  }
}
