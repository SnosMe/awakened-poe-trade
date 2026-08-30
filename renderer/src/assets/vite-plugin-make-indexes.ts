import type { Plugin } from 'vite'
import path from 'path'
import { makeIndexFiles } from './make-index-files.mjs'

export function makeIndexFilesPlugin (): Plugin {
  let timeout: NodeJS.Timeout | null = null

  return {
    name: 'make-index-files',
    buildStart () {
      makeIndexFiles()
    },
    configureServer (server) {
      server.watcher.add(path.resolve(__dirname, '../../public/data/**/*.ndjson'))
      server.watcher.on('change', (file) => {
        if (file.endsWith('.ndjson')) {
          if (timeout) {
            clearTimeout(timeout)
          }
          timeout = setTimeout(() => {
            makeIndexFiles()
            server.config.logger.info('Regenerated all *.ndjson index files.', { timestamp: true })
            timeout = null
          }, 100)
        }
      })
    }
  }
}
