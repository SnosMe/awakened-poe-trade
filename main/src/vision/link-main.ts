import { Worker } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'
import type { WorkerAPI } from './link-worker'
import type { ImageData } from './utils'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export class OcrWorker {
  // Point directly to the cv-ocr folder in main directory
  private binDir = path.join(__dirname, '..', 'cv-ocr')
  private api: Comlink.Remote<WorkerAPI>
  private lang = ''

  private constructor () {
    const worker = new Worker(__dirname + '/vision.js')
    this.api = Comlink.wrap<WorkerAPI>(nodeEndpoint(worker))
  }

  static async create () {
    const worker = new OcrWorker()
    try {
      // Verify opencv.js exists before initializing
      const opencvPath = path.join(worker.binDir, 'opencv.js')
      if (!fs.existsSync(opencvPath)) {
        throw new Error(`OpenCV file not found at: ${opencvPath}\nPlease ensure cv-ocr folder is in the correct location`)
      }
      
      await worker.api.init(worker.binDir)
    } catch (error) {
      console.error('OcrWorker initialization failed:', error)
      // Don't throw - let it continue with limited functionality
    }
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

  async readItemColors (image: ImageData, mouseX?: number, mouseY?: number) {
    const result = await this.api.readItemColors(
      Comlink.transfer(image, [image.data.buffer]), mouseX, mouseY)
    return result
  }
}
