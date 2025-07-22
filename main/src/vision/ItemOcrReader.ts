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
  isEmpty: boolean
  saturation: number // HSV saturation value (0-255)
  value: number // HSV value/brightness (0-255)
}

export class ItemOcrReader {
  private constructor() {}

  static async create(): Promise<ItemOcrReader> {
    if (!cv) {
      throw new Error('OpenCV not initialized - cannot create ItemOcrReader')
    }
    return new ItemOcrReader()
  }

  analyzeItemColors(
    screenshot: ImageData, 
    mouseX?: number, 
    mouseY?: number,
    customThresholds?: {
      matched: { saturation: number; value: number };
      unmatched: { saturation: number; value: number };
    }
  ): ItemColorResult {
    const startTime = performance.now()
    
    try {
      // Verify OpenCV is available
      if (!cv || typeof cv.Mat !== 'function') {
        throw new Error('OpenCV not properly initialized')
      }

      const colorMat = Bindings.cvMatFromImage(screenshot)
      
      // Verify Mat was created successfully
      if (!colorMat || colorMat.empty()) {
        throw new Error('Failed to create OpenCV Mat from image data')
      }

      let roiRect;

      if (mouseX !== undefined && mouseY !== undefined) {
        // Create a 58x58 rectangle centered on mouse cursor
        const rectSize = 58
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
      let isMatched = false;
      let matchConfidence = 0;
      
      // Use custom thresholds if provided, otherwise use default hardcoded values
      if (customThresholds) {
        // When using custom thresholds, determine if item is matched or unmatched
        // based on proximity to either threshold set
        const matchedThreshold = customThresholds.matched;
        const unmatchedThreshold = customThresholds.unmatched;
        
        // Calculate distance to matched threshold
        const matchedDistance = Math.sqrt(
          Math.pow(saturation - matchedThreshold.saturation, 2) + 
          Math.pow(value - matchedThreshold.value, 2)
        );
        
        // Calculate distance to unmatched threshold  
        const unmatchedDistance = Math.sqrt(
          Math.pow(saturation - unmatchedThreshold.saturation, 2) + 
          Math.pow(value - unmatchedThreshold.value, 2)
        );
        
        // Item is considered matched if it's closer to matched threshold
        isMatched = matchedDistance < unmatchedDistance;
        matchConfidence = isMatched ? (1 - matchedDistance / 100) : (unmatchedDistance / 100);
      } else {
        // Default hardcoded thresholds - rule of thumb from observation:
        // - Grey items: saturation < 30, value < 36
        // - Colored items: saturation > 40, value > 60
        
        if (saturation > 45 && value > 65) {
          isMatched = true;
          matchConfidence = 1;
        } else if (saturation > 38 && value > 55) {
          isMatched = true;
          matchConfidence = 0.8;
        } else if (saturation > 33 && value > 45) {
          isMatched = true;
          matchConfidence = 0.6;
        } else {
          isMatched = false;
          matchConfidence = 0.2;
        }
      }
      // console.log("isMatched", isMatched ? "COLORED" : "GREY", " :  ", saturation, value);
      // around this is empty 6.766349583828775 8.352853745541022
      let isEmpty = saturation < 9 && value < 12
      
      // Clean up Mats
      colorMat.delete()
      roi.delete()
      hsvMat.delete()
      hsvMat2.delete()
      
      const elapsed = performance.now() - startTime
      
      return {
        elapsed,
        isMatched,
        averageColor,
        isEmpty,
        saturation,
        value,
      }
      
    } catch (error) {
      const elapsed = performance.now() - startTime
      console.error('Error in analyzeItemColors:', error)
      
      // Return default values on error
      return {
        elapsed,
        isMatched: false,
        averageColor: { r: 0, g: 0, b: 0 },
        isEmpty: false,
        saturation: 0,
        value: 0,
      }
    }
  }

  // Keep the old method name for backward compatibility
  ocrItemTooltip(
    screenshot: ImageData, 
    mouseX?: number, 
    mouseY?: number,
    customThresholds?: {
      matched: { saturation: number; value: number };
      unmatched: { saturation: number; value: number };
    }
  ): ItemColorResult {
    return this.analyzeItemColors(screenshot, mouseX, mouseY, customThresholds)
  }
} 


