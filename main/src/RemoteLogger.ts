import type { ServerEvents } from './server'

export class Logger {
  constructor (
    private server: ServerEvents
  ) {}

  write (message: string) {
    this.server.sendEventTo('broadcast', {
      name: 'MAIN->CLIENT::log-entry',
      payload: { message }
    })
  }
}
