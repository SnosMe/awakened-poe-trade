import path from 'path'
import crypto from 'crypto'
import fs from 'fs/promises'
import fastifyStatic from '@fastify/static'
import { app } from 'electron'
import type { FastifyInstance } from 'fastify'

export function addFileUploadRoutes (server: FastifyInstance) {
  const uploadsPath = path.join(app.getPath('userData'), 'apt-data', 'files')

  server.register(fastifyStatic, {
    root: uploadsPath,
    prefix: '/uploads/',
    decorateReply: false
  })

  server.post<{
    Params: { file: string },
    Body: Buffer
  }>('/uploads/:file', { bodyLimit: 16_000_000 }, async (req) => {
    const contents = req.body
    const hash = crypto.createHash('md5').update(contents).digest('hex')
    const filename = `${hash}${path.extname(req.params.file)}`

    await fs.mkdir(uploadsPath, { recursive: true })
    await fs.writeFile(path.join(uploadsPath, filename), contents)

    return { name: filename }
  })
}
