import type { RateLimiter } from './RateLimiter'
import hash from 'object-hash'

const MIN_TTL = 300

export class Cache {
  private cached = new Map<string, unknown>()

  get<T = unknown> (key: unknown): T | undefined {
    const _key = hash.sha1(JSON.parse(JSON.stringify(key)))
    return this.cached.get(_key) as T | undefined
  }

  set<T = unknown> (key: unknown, value: T, ttl: number): void {
    const _key = hash.sha1(JSON.parse(JSON.stringify(key)))
    this.cached.set(_key, value)

    setTimeout(() => {
      this.cached.delete(_key)
    }, ttl * 1000)
  }

  static deriveTtl (...limits: RateLimiter[]): number {
    return Math.max(MIN_TTL, ...limits.map(limit => limit.window))
  }
}
