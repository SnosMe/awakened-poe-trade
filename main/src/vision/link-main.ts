import { Worker } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'
import type { WorkerAPI } from './link-worker'
import type { ImageData } from './utils'
import { app } from 'electron'
import path from 'path'

export class OcrWorker {
  private binDir = path.join(app.getPath('userData'), 'apt-data/cv-ocr')
  private api: Comlink.Remote<WorkerAPI>
  private lang = ''

  private constructor () {
    const worker = new Worker(__dirname + '/vision.js')
    this.api = Comlink.wrap<WorkerAPI>(nodeEndpoint(worker))
  }

  static async create () {
    const worker = new OcrWorker()
    try {
      await worker.api.init(worker.binDir)
    } catch {}
    return worker
  }

  async updateOptions (lang: string) {
    try {
      if (lang !== this.lang) {
        await this.api.changeLanguage(lang, this.binDir)
      }
    } catch {} finally {
      this.lang = lang
    }
  }

  async findHeistGems (image: ImageData) {
    const result = await this.api.findHeistGems(
      Comlink.transfer(image, [image.data.buffer]))
    return result
  }
}
