import { parentPort } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'
import * as Bindings from './wasm-bindings'
import { HeistGemFinder } from './HeistGemFinder'
import { ItemOcrReader } from './ItemOcrReader'
import { ImageData } from './utils'

let _heistGems: HeistGemFinder | null = null
let _itemOcr: ItemOcrReader | null = null
let _changeLangPromise = Promise.resolve()

const WorkerBody = {
  async init (binDir: string) {
    // Try to initialize with full OCR capability first
    try {
      await Bindings.init(binDir) // false = try full OCR mode
      _heistGems = await HeistGemFinder.create(binDir)
      _itemOcr = await ItemOcrReader.create()
    } catch (error) {
      // Fall back to color-only mode
      try {
        await Bindings.init(binDir) // true = colorOnlyMode
      } catch (colorError) {
        throw colorError
      }
    }
    
  },
  async changeLanguage (lang: string, binDir: string) {
    await _changeLangPromise
    _changeLangPromise = Bindings.changeLanguage(lang, binDir)
    await _changeLangPromise
  },
  async findHeistGems (screenshot: ImageData) {
    if (!_heistGems) {
      throw new Error('HeistGemFinder not available - OCR files missing. Please install OCR data files.')
    }
    await _changeLangPromise
    return _heistGems.ocrScreenshot(screenshot)
  },
  async readItemColors (
    screenshot: ImageData, 
    mouseX?: number, 
    mouseY?: number,
    customThresholds?: {
      matched: { saturation: number; value: number };
      unmatched: { saturation: number; value: number };
    }
  ) {
    if (!_itemOcr) {
      throw new Error('ItemOcrReader not available - color analysis initialization failed')
    }
    return _itemOcr.analyzeItemColors(screenshot, mouseX, mouseY, customThresholds)
  }
}
Comlink.expose(WorkerBody, nodeEndpoint(parentPort!))

export type WorkerAPI = Comlink.Remote<typeof WorkerBody>
