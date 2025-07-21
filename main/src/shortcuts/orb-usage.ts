import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import { mouse, Point } from "@nut-tree-fork/nut-js";
import { HostClipboard } from "./HostClipboard";
import { OverlayWindow } from "../windowing/OverlayWindow";
import type { OcrWorker } from "../vision/link-main";

const MOUSE_TIMEOUT = 200;


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
  itemGrid?: { width: number; height: number };
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
  options: ProcessOptions = {},
  screenshot?: any // Optional screenshot parameter
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
    console.log(`\n(${Math.round((y - STASH.start.y) / STASH.gridSize)}, ${Math.round((x - STASH.start.x) / STASH.gridSize)})`);

    // Move mouse to item
    await mouse.move([new Point(x, y)]);
    await new Promise(resolve => setTimeout(resolve, mouseTimeout));

    // Use provided screenshot or capture new one
    const imageData = screenshot || overlay.screenshot();
    const colorResult = await ocrWorker.readItemColors(imageData, x, y);
    
    result.isMatched = colorResult.isMatched;
    result.averageColor = colorResult.averageColor;
    
    // console.log(`Item: ${colorResult.isMatched ? 'COLORED' : 'GREY'}`);

    // Check skip pattern
    // const shouldSkip = shouldSkipItem(colorResult.isMatched, skipPattern);
    
    if (result.isMatched) {
      console.log('Skipping item - matches skip pattern');
      return result;
    }

    // Use orb if enabled
    if (useOrb) {
      console.log(`Using ${orbType} orb`);
      await mouse.leftClick(); // Keep your commented out click
      await new Promise(resolve => setTimeout(resolve, delayBetweenClicks));
      result.processed = true;
    }

    result.processed = true;

    return result;

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
  // No screenshot parameter - will capture its own
  return processItem(currentPos.x, currentPos.y, ocrWorker, overlay, options);
}

/**
 * Process all items in stash using grid pattern - SIMPLIFIED ROUND-BASED VERSION
 */
export async function processStashItems(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions & {
    stashGrid?: { width: number; height: number };
    onItemProcessed?: (result: ItemProcessResult, row: number, col: number, round: number) => void;
    onRoundComplete?: (round: number) => void;
    onComplete?: (totalProcessed: number) => void;
    delayBetweenRounds?: number;
  } = {}
): Promise<ItemProcessResult[]> {
  const {
    maxAttempts = 2, // Number of rounds to process the full grid
    delayBetweenItems = 300,
    delayBetweenRounds = 300,
    stashGrid = { width: 3, height: 12 },
    onItemProcessed,
    onRoundComplete,
    onComplete,
    itemGrid = { width: 1 , height: 1 }
  } = options;

  overlay.assertGameActive();
  FLAG.stop = 0;
  uIOhook.keyToggle(Key.Shift, "down");

  // const allResults: ItemProcessResult[] = [];
  const grid = {
    startX: STASH.start.x,
    startY: STASH.start.y,
    width: stashGrid.width,
    height: stashGrid.height,
    itemSize: STASH.gridSize,
  };

  let totalProcessed = 0;


  console.log(`Processing stash grid: ${grid.width}x${grid.height} for ${maxAttempts} rounds`);

  // Process multiple rounds
  for (let round = 0; round < maxAttempts && FLAG.stop === 0; round++) {
    console.log(`\n=== Starting Round ${round + 1}/${maxAttempts} ===`);
    
    // Capture screenshot once per round
    console.log(`Capturing screenshot for round ${round + 1}...`);
    const screenshot = overlay.screenshot();
    
    
    // Process full grid for this round
    for (let col = 0; col < grid.width && FLAG.stop === 0; col+=itemGrid.width) {
      for (let row = 0; row < grid.height && FLAG.stop === 0; row+=itemGrid.height) {
        
        const itemX = grid.startX + col * grid.itemSize
        const itemY = grid.startY + row * grid.itemSize
        
        // Pass the shared screenshot to avoid capturing for each item
        const result = await processItem(itemX, itemY, ocrWorker, overlay, options, screenshot);
        if (result.processed) {
          totalProcessed++;
        }
        
        if (onItemProcessed) {
          onItemProcessed(result, row, col, round + 1);
        }
        
        if (delayBetweenItems > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
        }
      }
    }
    
    
    if (onRoundComplete) {
      onRoundComplete(round + 1);
    }
    
    // Delay between rounds (except after the last round)
    if (round < maxAttempts - 1 && FLAG.stop === 0 && delayBetweenRounds > 0) {
      console.log(`Waiting ${delayBetweenRounds}ms before next round...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenRounds));
    }
  }

  // const totalItems = allResults.length;
  // const totalProcessed = allResults.filter(r => r.processed).length;
  console.log(`\n=== Completed all ${maxAttempts} rounds ===`);
  
  if (onComplete) {
    onComplete(totalProcessed);
  }
}

export const cleanupOrbUsage = () => {
  uIOhook.keyToggle(Key.Shift, "up");
}

/**
 * High-level function: Use orb on entire stash - SIMPLIFIED
 */
export async function useOrbOnStash(
  orbPosition: { x: number; y: number },
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions & {
    stashGrid?: { width: number; height: number };
    onItemProcessed?: (result: ItemProcessResult, row: number, col: number, round: number) => void;
    onRoundComplete?: (round: number) => void;
    delayBetweenRounds?: number;
  } = {}
): Promise<ItemProcessResult[]> {
  // await setupOrbUsage(orbPosition, options.orbType || "unknown");
  
  try {
    const results = await processStashItems(ocrWorker, overlay, {
      ...options,
      useOrb: true,
      onRoundComplete: (round) => {
        console.log(`Round ${round}: Used orb on items`);
        
        if (options.onRoundComplete) {
          options.onRoundComplete(round);
        }
      },
      onComplete: (totalProcessed) => {
        console.log(`Completed all rounds: Used orb ${totalProcessed} total items`);
      }
    });
    return results;
  } finally {
    cleanupOrbUsage();
  }
}

/**
 * Analysis only: Check all stash items - SIMPLIFIED
 */
export async function analyzeStash(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: { 
    stashGrid?: { width: number; height: number };
    maxAttempts?: number; // Number of rounds
    delayBetweenRounds?: number;
  } = {}
): Promise<ItemProcessResult[]> {
  return processStashItems(ocrWorker, overlay, { 
    ...options, 
    useOrb: false 
  });
}

/**
 * Original function - SIMPLIFIED
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
  // return () => cleanupOrbUsage();
}


export const useOrbOnMouse = async (options: ProcessOptions, ocrWorker: OcrWorker, overlay: OverlayWindow ) => {
  const res = await processItemAtCursor(ocrWorker, overlay, options)
  return res  
}
