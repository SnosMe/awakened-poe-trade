import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import { mouse, Point } from "@nut-tree-fork/nut-js";
import { HostClipboard } from "./HostClipboard";
import { OverlayWindow } from "../windowing/OverlayWindow";
import type { OcrWorker } from "../vision/link-main";

const MOUSE_TIMEOUT = 1000;


const STASH = {
  start: {
    x: 58, y: 200
  },
  end: {
    x: 828, y: 975
  },
  gridSize: 70,
}

// Global flag to stop operations
export const FLAG = { stop: 0 };

interface OrbUsageOptions {
  orbType: string;
  skipPattern?: string | RegExp;
  maxAttempts?: number;
  delayBetweenItems?: number;
  delayBetweenClicks?: number;
  stashGrid?: { width: number; height: number };
}

interface ItemProcessResult {
  position: { x: number; y: number };
  isMatched: boolean;
  averageColor: { r: number; g: number; b: number };
  processed: boolean;
  error?: string;
}

interface ProcessOptions {
  orbType?: string;
  skipPattern?: string | RegExp;
  delayBetweenClicks?: number;
  delayBetweenItems?: number;
  mouseTimeout?: number;
  useOrb?: boolean;
  maxAttempts?: number;
}

/**
 * Core function: Process a single item at given coordinates
 * This is the base function that all other processing functions use
 */
export async function processItem(
  x: number,
  y: number,
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions = {}
): Promise<ItemProcessResult> {
  const {
    orbType = "unknown",
    skipPattern,
    delayBetweenClicks = 100,
    mouseTimeout = MOUSE_TIMEOUT,
    useOrb = false
  } = options;

  const result: ItemProcessResult = {
    position: { x, y },
    isMatched: false,
    averageColor: { r: 0, g: 0, b: 0 },
    processed: false
  };

  try {
    console.log(`Processing item at (${x}, ${y})`);

    // Move mouse to item
    await mouse.move([new Point(x, y)]);
    await new Promise(resolve => setTimeout(resolve, mouseTimeout));

    // Analyze item colors
    const screenshot = overlay.screenshot();
    const colorResult = await ocrWorker.readItemColors(screenshot, x, y);
    
    result.isMatched = colorResult.isMatched;
    result.averageColor = colorResult.averageColor;
    
    console.log(`Item: ${colorResult.isMatched ? 'COLORED' : 'GREY'}`);

    // Check skip pattern
    const shouldSkip = shouldSkipItem(colorResult.isMatched, skipPattern);
    
    if (shouldSkip) {
      console.log('Skipping item - matches skip pattern');
      return result;
    }

    // Use orb if enabled
    if (useOrb) {
      console.log(`Using ${orbType} orb`);
      // await mouse.leftClick();
      await new Promise(resolve => setTimeout(resolve, delayBetweenClicks));
      result.processed = true;
    }

  } catch (error) {
    result.error = `Error: ${error}`;
    console.log(result.error);
  }

  return result;
}

/**
 * Helper function to determine if item should be skipped
 */
function shouldSkipItem(isMatched: boolean, skipPattern?: string | RegExp): boolean {
  if (!skipPattern) return false;
  
  if (typeof skipPattern === 'string') {
    return isMatched && skipPattern === 'matched';
  } else if (skipPattern instanceof RegExp) {
    return isMatched; // Custom logic can be added here
  }
  
  return false;
}

/**
 * Process item at current mouse cursor position
 */
export async function processItemAtCursor(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions = {}
): Promise<ItemProcessResult> {
  overlay.assertGameActive();
  
  const currentPos = await mouse.getPosition();
  return processItem(currentPos.x, currentPos.y, ocrWorker, overlay, options);
}

/**
 * Process all items in stash using grid pattern
 */
export async function processStashItems(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions & {
    stashGrid?: { width: number; height: number };
    onItemProcessed?: (result: ItemProcessResult, row: number, col: number) => void;
    onComplete?: (results: ItemProcessResult[]) => void;
  } = {}
): Promise<ItemProcessResult[]> {
  const {
    maxAttempts = 144, // 12x12 grid
    delayBetweenItems = 500,
    stashGrid = { width: 12, height: 12 },
    onItemProcessed,
    onComplete
  } = options;

  overlay.assertGameActive();
  FLAG.stop = 0;

  const results: ItemProcessResult[] = [];
  const grid = {
    startX: STASH.start.x,
    startY: STASH.start.y,
    width: stashGrid.width,
    height: stashGrid.height,
    itemSize: STASH.gridSize,
  };

  console.log("Processing stash grid:", grid);

  let attempts = 0;
  
  for (let col = 0; col < grid.width && FLAG.stop === 0 && attempts < maxAttempts; col++) {
    for (let row = 0; row < grid.height && FLAG.stop === 0 && attempts < maxAttempts; row++) {
      attempts++;
      
      const itemX = grid.startX + col * grid.itemSize;
      const itemY = grid.startY + row * grid.itemSize;
      
      const result = await processItem(itemX, itemY, ocrWorker, overlay, options);
      results.push(result);
      
      if (onItemProcessed) {
        onItemProcessed(result, row, col);
      }
      
      if (delayBetweenItems > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
      }
    }
  }

  console.log(`Processed ${results.length} items`);
  
  if (onComplete) {
    onComplete(results);
  }

  return results;
}

/**
 * Setup orb for usage (select orb, hold shift)
 */
export async function setupOrbUsage(orbPosition: { x: number; y: number }, orbType: string): Promise<void> {
  return;
  console.log(`Selecting ${orbType} orb at (${orbPosition.x}, ${orbPosition.y})`);
  
  await mouse.move([new Point(orbPosition.x, orbPosition.y)]);
  await new Promise(resolve => setTimeout(resolve, 100));
  await mouse.leftClick();
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log("Holding Shift for multiple orb usage");
  uIOhook.keyToggle(Key.Shift, "down");
}

/**
 * Cleanup orb usage (release shift)
 */
export function cleanupOrbUsage(): void {
  console.log("Releasing Shift");
  uIOhook.keyToggle(Key.Shift, "up");
  FLAG.stop = 1;
}

/**
 * High-level function: Use orb on cursor item
 */
export async function useOrbAtCursor(
  orbPosition: { x: number; y: number },
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions = {}
): Promise<ItemProcessResult> {
  await setupOrbUsage(orbPosition, options.orbType || "unknown");
  
  try {
    const result = await processItemAtCursor(ocrWorker, overlay, {
      ...options,
      useOrb: true
    });
    return result;
  } finally {
    cleanupOrbUsage();
  }
}

/**
 * High-level function: Use orb on entire stash
 */
export async function useOrbOnStash(
  orbPosition: { x: number; y: number },
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions & {
    stashGrid?: { width: number; height: number };
    onItemProcessed?: (result: ItemProcessResult, row: number, col: number) => void;
  } = {}
): Promise<ItemProcessResult[]> {
  await setupOrbUsage(orbPosition, options.orbType || "unknown");
  
  try {
    const results = await processStashItems(ocrWorker, overlay, {
      ...options,
      useOrb: true,
      onComplete: (results) => {
        console.log(`Completed processing ${results.length} items`);
        const processedCount = results.filter(r => r.processed).length;
        console.log(`Used orb on ${processedCount} items`);
      }
    });
    return results;
  } finally {
    cleanupOrbUsage();
  }
}

/**
 * Analysis only: Check item at cursor (no orb usage)
 */
export async function analyzeItemAtCursor(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow
): Promise<ItemProcessResult> {
  return processItemAtCursor(ocrWorker, overlay, { useOrb: false });
}

/**
 * Analysis only: Check all stash items (no orb usage)
 */
export async function analyzeStash(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: { stashGrid?: { width: number; height: number } } = {}
): Promise<ItemProcessResult[]> {
  return processStashItems(ocrWorker, overlay, { 
    ...options, 
    useOrb: false 
  });
}

/**
 * Process items in a custom rectangle area
 */
export async function processRectangleArea(
  startX: number, 
  startY: number, 
  width: number, 
  height: number,
  itemSize: number,
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions = {}
): Promise<ItemProcessResult[]> {
  const results: ItemProcessResult[] = [];
  
  const cols = Math.floor(width / itemSize);
  const rows = Math.floor(height / itemSize);
  
  for (let col = 0; col < cols && FLAG.stop === 0; col++) {
    for (let row = 0; row < rows && FLAG.stop === 0; row++) {
      const x = startX + col * itemSize;
      const y = startY + row * itemSize;
      const result = await processItem(x, y, ocrWorker, overlay, options);
      results.push(result);
      
      if (options.delayBetweenItems) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenItems));
      }
    }
  }
  
  return results;
}

/**
 * Process inventory (6x4 grid) - example extension
 */
export async function processInventory(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions = {}
): Promise<ItemProcessResult[]> {
  // Inventory coordinates (these would need to be adjusted for actual game)
  const INVENTORY = {
    start: { x: 1275, y: 610 },
    gridSize: 53,
    width: 12,
    height: 5
  };
  
  return processRectangleArea(
    INVENTORY.start.x,
    INVENTORY.start.y,
    INVENTORY.width * INVENTORY.gridSize,
    INVENTORY.height * INVENTORY.gridSize,
    INVENTORY.gridSize,
    ocrWorker,
    overlay,
    options
  );
}

/**
 * Original function - now just a wrapper for backward compatibility
 */
export async function useOrbOnStashItemsWithOrbSelection(
  options: OrbUsageOptions & { orbPosition: { x: number; y: number } },
  clipboard: HostClipboard,
  overlay: OverlayWindow,
  ocrWorker: OcrWorker
) {
  const results = await useOrbOnStash(
    options.orbPosition,
    ocrWorker,
    overlay,
    options
  );

  // Return stop function
  return () => cleanupOrbUsage();
}


export const useOrbOnMouse = async (options: ProcessOptions, ocrWorker: OcrWorker, overlay: OverlayWindow ) => {
  const res = await processItemAtCursor(ocrWorker, overlay, options)
  return res  
}
