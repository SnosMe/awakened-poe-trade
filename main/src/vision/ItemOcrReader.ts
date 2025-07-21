import * as Bindings from './wasm-bindings'
import { cv } from './wasm-bindings'
import {
  timeIt,
  ImageData
} from './utils'

interface ItemColorResult {
  elapsed: number
  isMatched: boolean // true if item has color, false if grey/unmatched
  averageColor: { r: number, g: number, b: number }
}

export class ItemOcrReader {
  private constructor() {}

  static async create(): Promise<ItemOcrReader> {
    if (!cv) {
      throw new Error('OpenCV not initialized - cannot create ItemOcrReader')
    }
    return new ItemOcrReader()
  }

  analyzeItemColors(screenshot: ImageData, mouseX?: number, mouseY?: number): ItemColorResult {
    const startTime = performance.now()
    
    try {
      // Verify OpenCV is available
      if (!cv || typeof cv.Mat !== 'function') {
        throw new Error('OpenCV not properly initialized')
      }

      // Create Mat from screenshot
      const colorMat = Bindings.cvMatFromImage(screenshot)
      
      // Verify Mat was created successfully
      if (!colorMat || colorMat.empty()) {
        throw new Error('Failed to create OpenCV Mat from image data')
      }

      let roiRect;

      if (mouseX !== undefined && mouseY !== undefined) {
        // Create a 70x70 rectangle centered on mouse cursor
        const rectSize = 60
        const halfSize = Math.floor(rectSize / 2)
        
        // Calculate start coordinates ensuring we don't go out of bounds
        const startX = Math.max(0, Math.min(screenshot.width - rectSize, mouseX - halfSize))
        const startY = Math.max(0, Math.min(screenshot.height - rectSize, mouseY - halfSize))
        
        roiRect = new cv.Rect(startX, startY, rectSize, rectSize)
      } else {
        roiRect = new cv.Rect(0, 0, screenshot.width, screenshot.height)
      }
      
      const roi = colorMat.roi(roiRect)
      const hsvMat = new cv.Mat()
      
      // Convert BGR to HSV for better color analysis
      cv.cvtColor(roi, hsvMat, cv.COLOR_BGRA2RGB)
      
      // Calculate mean color values
      const means = cv.mean(roi)
      
      // Extract RGB values (OpenCV uses BGR format)
      const averageColor = {
        r: Math.round(means[2] || 0), // Red channel
        g: Math.round(means[1] || 0), // Green channel  
        b: Math.round(means[0] || 0)  // Blue channel
      }
      
      // Determine if item is colored or grey based on saturation
      // Convert to HSV to check saturation
      const hsvMat2 = new cv.Mat()
      cv.cvtColor(roi, hsvMat2, cv.COLOR_BGRA2HSV)
      const hsvMeans = cv.mean(hsvMat2)
      const saturation = hsvMeans[1] || 0
      const value = hsvMeans[2] || 0
      
      // Item is considered "matched"/colored if it has sufficient saturation and value
      const isMatched = value > 33
      console.log("isMatched", isMatched, saturation, value);
      
      // Clean up Mats
      colorMat.delete()
      roi.delete()
      hsvMat.delete()
      hsvMat2.delete()
      
      const elapsed = performance.now() - startTime
      
      return {
        elapsed,
        isMatched,
        averageColor
      }
      
    } catch (error) {
      const elapsed = performance.now() - startTime
      console.error('Error in analyzeItemColors:', error)
      
      // Return default values on error
      return {
        elapsed,
        isMatched: false,
        averageColor: { r: 0, g: 0, b: 0 }
      }
    }
  }

  // Keep the old method name for backward compatibility
  ocrItemTooltip(screenshot: ImageData, mouseX?: number, mouseY?: number): ItemColorResult {
    return this.analyzeItemColors(screenshot, mouseX, mouseY)
  }
} 


