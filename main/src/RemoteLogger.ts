import type { ServerEvents } from './server'

export class Logger {
  history = ''

  constructor (
    private server: ServerEvents
  ) {}

  write (message: string) {
    message = `[${new Date().toLocaleTimeString()}] ${message}\n`
    this.history += message
    this.server.sendEventTo('broadcast', {
      name: 'MAIN->CLIENT::log-entry',
      payload: { message }
    })
  }
}
