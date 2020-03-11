import path from 'path'
import { app } from 'electron'
import winston from 'winston'
import { config } from './config'

export const logger = winston.createLogger({
  level: config.get('logLevel'),
  format: winston.format.json(),
  defaultMeta: { source: 'etc' },
  transports: [
    new winston.transports.File({
      filename: path.join(app.getPath('userData'), 'apt-data', 'logs.txt'),
      options: { flags: 'w' }
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format((info) => ({ ...info }))(),
      winston.format.colorize({ level: true }),
      winston.format.printf((info) => {
        const { source, level, message, ...meta } = info
        return `${level} [${source}]: ${message} ${JSON.stringify(meta)}`
      })
    )
  }))
}
