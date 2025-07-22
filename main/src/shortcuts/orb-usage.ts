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
  monitorMouseMovement: false, // Only start monitoring after first item
  processedPositions: new Map<string, { isMatched: boolean, isEmpty?: boolean, processed: boolean }>() // Track processed positions
};

// Helper function to create position key
function getPositionKey(row: number, col: number): string {
  return `${row},${col}`;
}

// Check if position should be skipped
function shouldSkipPosition(row: number, col: number): boolean {
  const key = getPositionKey(row, col);
  const positionData = FLAG.processedPositions.get(key);
  return positionData?.isMatched === true || positionData?.isEmpty === true; // Skip if already processed and matched
}

// Record position result
function recordPositionResult(row: number, col: number, result: ItemProcessResult) {
  const key = getPositionKey(row, col);
  FLAG.processedPositions.set(key, {
    isMatched: result.isMatched,
    isEmpty: result.isEmpty,
    processed: result.processed
  });
}

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
  FLAG.processedPositions.clear(); // Clear position tracking
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
  isEmpty: boolean;
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
  customColorThresholds?: {
    matched: { saturation: number; value: number };
    unmatched: { saturation: number; value: number };
  };
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
    delayBetweenClicks = 100,
    mouseTimeout = MOUSE_TIMEOUT,
    useOrb = false,
    customColorThresholds
  } = options;

  const result: ItemProcessResult = {
    position: { x, y },
    isMatched: false,
    averageColor: { r: 0, g: 0, b: 0 },
    processed: false,
    isEmpty: false
  };

  try {
    console.log(`\n(${Math.round((y - STASH.start.y) / STASH.gridSize)}, ${Math.round((x - STASH.start.x) / STASH.gridSize)})`);

    // Move mouse to item
    await mouse.move([new Point(x, y)]);
    await new Promise(resolve => setTimeout(resolve, mouseTimeout));

    // Use provided screenshot or capture new one
    const imageData = screenshot || overlay.screenshot();
    const colorResult = await ocrWorker.readItemColors(imageData, x, y, customColorThresholds);
    
    result.isMatched = colorResult.isMatched;
    result.averageColor = colorResult.averageColor;
    result.isEmpty = colorResult.isEmpty;
    console.log(`Item: ${colorResult.isMatched ? 'COLORED' : 'GREY'}`);

    // Check skip pattern
    // const shouldSkip = shouldSkipItem(colorResult.isMatched, skipPattern);
    
    if (result.isMatched) {
      console.log('Skipping item - matches skip pattern');
      return result;
    }

    // Use orb if enabled
    if (useOrb) {
      // console.log(`Using ${orbType} orb`);
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
 * Process item at current mouse cursor position
 */
export async function processItemAtCursor(
  ocrWorker: OcrWorker,
  overlay: OverlayWindow,
  options: ProcessOptions = {}
): Promise<ItemProcessResult | null> {
  overlay.assertGameActive();
  const { maxAttempts = 1, delayBetweenItems = 150} = options;
  // Initialize stopping mechanisms for single item
  const cleanup = await initializeStopMechanisms();

  uIOhook.keyToggle(Key.Shift, "down");

  console.log("Processing item at cursor", options);
  
  try {
    const currentPos = await mouse.getPosition();
    // No screenshot parameter - will capture its own
    for (let i = 0; i < maxAttempts; i++) {
      const result = await processItem(currentPos.x, currentPos.y, ocrWorker, overlay, options);
      if (result.isMatched) {
        return result;
      }
      if (delayBetweenItems > 0 && i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
      }
    }
    return null;
  } finally {
    cleanup();
    uIOhook.keyToggle(Key.Shift, "up");
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

  // Clear processed positions for new operation
  FLAG.processedPositions.clear();
  
  const allResults: ItemProcessResult[] = [];
  const grid = {
    startX: STASH.start.x,
    startY: STASH.start.y,
    width: stashGrid.width,
    height: stashGrid.height,
    itemSize: STASH.gridSize,
  };

  let totalProcessed = 0;
  let totalSkipped = 0;

  console.log(`Processing stash grid: ${grid.width}x${grid.height} for ${maxAttempts} rounds`);

  try {
    // Process multiple rounds
    for (let round = 0; round < maxAttempts && !(await shouldStop()); round++) {
      console.log(`\n=== Starting Round ${round + 1}/${maxAttempts} ===`);
      
      // Capture screenshot once per round
      // console.log(`Capturing screenshot for round ${round + 1}...`);
      const screenshot = overlay.screenshot();
      
      let roundProcessed = 0;
      let roundSkipped = 0;
      
      // Process full grid for this round
      for (let col = 0; col < grid.width && !(await shouldStop()); col += itemGrid.width) {
        for (let row = 0; row < grid.height && !(await shouldStop()); row += itemGrid.height) {
          
          // Skip positions that are already matched (colored)
          if (shouldSkipPosition(row, col)) {
            roundSkipped++;
            totalSkipped++;
            continue; // Skip this position entirely
          }
          
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
          
          // Record this position's result for future rounds
          recordPositionResult(row, col, result);
          
          if (result.processed) {
            totalProcessed++;
            roundProcessed++;
          }
          
          if (onItemProcessed) {
            onItemProcessed(result, row, col, round + 1);
          }
          
          if (delayBetweenItems > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
          }
        }
      }
      
      // console.log(`Round ${round + 1}: Processed ${roundProcessed} items, Skipped ${roundSkipped} items`);
      
      if (onRoundComplete) {
        onRoundComplete(round + 1);
      }
      
      // Delay between rounds (except after the last round)
      if (round < maxAttempts - 1 && !(await shouldStop()) && delayBetweenRounds > 0) {
        // console.log(`Waiting ${delayBetweenRounds}ms before next round...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRounds));
      }
    }

    // console.log(`\n=== Completed: Processed ${totalProcessed} items, Skipped ${totalSkipped} items ===`);
    
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
      onComplete: () => {
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
  overlay: OverlayWindow,
  ocrWorker: OcrWorker
) {

  // Return stop function
  // return () => cleanupOrbUsage();
}


export const useOrbOnMouse = async (options: ProcessOptions, ocrWorker: OcrWorker, overlay: OverlayWindow) => {
  const res = await processItemAtCursor(ocrWorker, overlay, options);
  return res;
}
