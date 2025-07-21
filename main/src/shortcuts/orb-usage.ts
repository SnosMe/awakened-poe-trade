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

// Enhanced stopping mechanism
export const FLAG = { 
  stop: 0,
  shiftPressed: false,
  escPressed: false,
  stashBounds: {
    minX: STASH.start.x - 200, // 200px buffer around stash
    maxX: STASH.end.x + 200,
    minY: STASH.start.y - 200, 
    maxY: STASH.end.y + 200
  },
  monitorMouseMovement: false // Only start monitoring after first item
};

// Enhanced stop checking function
async function shouldStop(): Promise<boolean> {
  if (FLAG.stop === 1) return true;
  if (FLAG.escPressed) return true;
  if (!FLAG.shiftPressed) return true; // Stop if shift is released
  
  // Stop if mouse moved outside stash area (only if we're monitoring)
  if (FLAG.monitorMouseMovement) {
    try {
      const currentPos = await mouse.getPosition();
      if (currentPos.x < FLAG.stashBounds.minX || 
          currentPos.x > FLAG.stashBounds.maxX ||
          currentPos.y < FLAG.stashBounds.minY || 
          currentPos.y > FLAG.stashBounds.maxY) {
        console.log("Stopping: Mouse moved outside stash area");
        return true;
      }
    } catch (error) {
      // If we can't get mouse position, don't stop for this reason
    }
  }
  
  return false;
}

// Initialize stopping mechanisms
async function initializeStopMechanisms() {
  FLAG.stop = 0;
  FLAG.escPressed = false;
  FLAG.shiftPressed = true; // Assume shift is pressed when starting
  FLAG.monitorMouseMovement = false; // Start monitoring after first item
  
  // Listen for key events
  const keyListener = (e: any) => {
    if (e.keycode === Key.Shift) {
      FLAG.shiftPressed = false;
      console.log("Stopping: Shift key released");
    } else if (e.keycode === Key.Escape) {
      FLAG.escPressed = true;
      console.log("Stopping: ESC key pressed");
    }
  };
  
  uIOhook.on('keyup', keyListener);
  
  // Return cleanup function
  return () => {
    uIOhook.removeListener('keyup', keyListener);
  };
}

// Clean up function
function cleanupStopMechanisms() {
  FLAG.stop = 0;
  FLAG.shiftPressed = false;
  FLAG.escPressed = false;
  FLAG.monitorMouseMovement = false;
  uIOhook.removeAllListeners('keyup');
}

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
  
  // Initialize stopping mechanisms for single item
  const cleanup = await initializeStopMechanisms();
  
  try {
    const currentPos = await mouse.getPosition();
    // No screenshot parameter - will capture its own
    return await processItem(currentPos.x, currentPos.y, ocrWorker, overlay, options);
  } finally {
    cleanup();
    cleanupStopMechanisms();
  }
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
    delayBetweenItems = 150,
    delayBetweenRounds = 300,
    stashGrid = { width: 3, height: 12 },
    itemGrid = { width: 1, height: 1 },
    onItemProcessed,
    onRoundComplete,
    onComplete
  } = options;

  overlay.assertGameActive();
  
  // Initialize enhanced stopping mechanisms
  const cleanup = await initializeStopMechanisms();
  uIOhook.keyToggle(Key.Shift, "down");

  const allResults: ItemProcessResult[] = [];
  const grid = {
    startX: STASH.start.x,
    startY: STASH.start.y,
    width: stashGrid.width,
    height: stashGrid.height,
    itemSize: STASH.gridSize,
  };

  let totalProcessed = 0;

  console.log(`Processing stash grid: ${grid.width}x${grid.height} for ${maxAttempts} rounds`);

  try {
    // Process multiple rounds
    for (let round = 0; round < maxAttempts && !(await shouldStop()); round++) {
      console.log(`\n=== Starting Round ${round + 1}/${maxAttempts} ===`);
      
      // Capture screenshot once per round
     // console.log(`Capturing screenshot for round ${round + 1}...`);
      const screenshot = overlay.screenshot();
      
      // Process full grid for this round
      for (let col = 0; col < grid.width && !(await shouldStop()); col += itemGrid.width) {
        for (let row = 0; row < grid.height && !(await shouldStop()); row += itemGrid.height) {
          
          const itemX = grid.startX + col * grid.itemSize;
          const itemY = grid.startY + row * grid.itemSize;
          
          // Enable mouse movement monitoring after first few items
          if (!FLAG.monitorMouseMovement) {
            FLAG.monitorMouseMovement = true;
         //   console.log("Started monitoring mouse movement outside stash area");
          }
          
          // Pass the shared screenshot to avoid capturing for each item
          const result = await processItem(itemX, itemY, ocrWorker, overlay, options, screenshot);
          allResults.push(result);
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
      if (round < maxAttempts - 1 && !(await shouldStop()) && delayBetweenRounds > 0) {
        // console.log(`Waiting ${delayBetweenRounds}ms before next round...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRounds));
      }
    }

   // console.log(`\n=== Completed all ${maxAttempts} rounds ===`);
    
    if (onComplete) {
      onComplete(totalProcessed);
    }
  } finally {
    // Always cleanup, regardless of how we exit
    cleanup();
    cleanupStopMechanisms();
  }
  
  return allResults;
}

export const cleanupOrbUsage = () => {
  uIOhook.keyToggle(Key.Shift, "up");
  cleanupStopMechanisms();
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
       // console.log(`Round ${round}: Used orb on items`);
        
        if (options.onRoundComplete) {
          options.onRoundComplete(round);
        }
      },
      onComplete: (totalProcessed) => {
       // console.log(`Completed all rounds: Used orb ${totalProcessed} total items`);
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


export const useOrbOnMouse = async (options: ProcessOptions, ocrWorker: OcrWorker, overlay: OverlayWindow) => {
  const res = await processItemAtCursor(ocrWorker, overlay, options);
  return res;
}
