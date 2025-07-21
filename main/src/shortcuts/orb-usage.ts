import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import { mouse, Point } from "@nut-tree-fork/nut-js";
import type { HostClipboard } from "./HostClipboard";
import type { OverlayWindow } from "../windowing/OverlayWindow";
import type { OcrWorker } from "../vision/link-main";

export interface OrbUsageOptions {
  orbType: "alteration" | "chaos";
  skipPattern?: RegExp;
  maxAttempts?: number;
  delayBetweenAttempts?: number;
  delayBetweenItems?: number;
  delayBetweenClicks?: number;
  stashGrid?: {
    startX: number;
    startY: number;
    width: number;
    height: number;
    itemSize: number;
  };
}

export interface StashItemPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}


export const FLAG = {
  stop: 0
}


const STASH = {
  start: {
    x: 55, y: 200
  },
  end: {
    x: 825, y: 975
  },
  gridSize: 70,
}

const MOUSE_TIMEOUT = 1000;


export async function useOrbOnStashItemsWithOrbSelection(
  options: OrbUsageOptions & { orbPosition: { x: number; y: number } },
  clipboard: HostClipboard,
  overlay: OverlayWindow,
  ocrWorker: OcrWorker
) {
  const {
    orbType,
    skipPattern,
    maxAttempts = 30,
    delayBetweenItems = 500,
    delayBetweenClicks = 100,
    stashGrid,
    orbPosition,
  } = options;

  FLAG.stop = 0;

  let attempts = 0;
  let isRunning = true;
  let res = [];

  // Always use the STASH constant for grid calculations
  const grid = {
    startX: STASH.start.x,
    startY: STASH.start.y,
    width: 12, // default stash
    height: 12,
    itemSize: STASH.gridSize,
  };

  console.log("Using stash grid:", grid);

  const processStashItem = async (row: number, col: number) => {
    if (!isRunning || attempts >= maxAttempts) {
      if (attempts >= maxAttempts) {
        console.log(
          `Max attempts (${maxAttempts}) reached for ${orbType} orb usage`
        );
      }
      return;
    }

    attempts++;

    // Calculate item position using STASH grid: position (col, row) = (startX + col * gridSize, startY + row * gridSize)
    const itemX = grid.startX + col * grid.itemSize;
    const itemY = grid.startY + row * grid.itemSize;

    try {
      if(FLAG.stop === 1) {
        console.log("Stopping orb usage");
        return;
      }

      console.log(`Processing item at grid position (${row}, ${col})` + "\n");

      // Move mouse to item using nut-js
      await mouse.move([new Point(itemX, itemY)]);

      // Wait a bit for the item tooltip to appear
      await new Promise((resolve) => setTimeout(resolve, MOUSE_TIMEOUT));

      // Check item color to see if it matches (has color) or not (grey)
      if (true) {
        try {
          // Take a screenshot and analyze item colors
          const screenshot = overlay.screenshot();
          const colorResult = await ocrWorker.readItemColors(screenshot, itemX, itemY);
          
          console.log(`Item (${row}, ${col}): ${colorResult.isMatched ? 'COLORED' : 'GREY'}`);
          res.push(colorResult.isMatched);
          // If item is matched (has color), skip it based on skipPattern logic
          // let shouldSkip = false;
          // if (typeof skipPattern === 'string') {
          //   // For string patterns, skip if item is matched and pattern says to skip matched items
          //   shouldSkip = colorResult.isMatched && skipPattern === 'matched';
          // } else {
          //   // For regex patterns, you can implement custom logic here
          //   shouldSkip = colorResult.isMatched;
          // }
          
          // if (shouldSkip) {
          //   console.log(`Skipping item at (${row}, ${col}) - matches pattern`);
          //   // Move to next item
          //   setTimeout(() => processNextItem(row, col), delayBetweenItems);
          //   return;
          // }
        } catch (error) {
          console.log("Failed to analyze item colors:", error);
        }
      }

      // Item doesn't match pattern, use orb on it
      // console.log(`Using ${orbType} orb on item at (${row}, ${col})`);

      // Click to use orb (Shift should already be held)
      // await mouse.leftClick();

      // Wait between clicks
      await new Promise((resolve) => setTimeout(resolve, delayBetweenClicks));

      // Move to next item
      setTimeout(() => processNextItem(row, col), delayBetweenItems);
    } catch (error) {
      console.log("Error processing stash item:", error);
      // Continue to next item even if there's an error
      setTimeout(() => processNextItem(row, col), delayBetweenItems);
    }
  };

  const processNextItem = (currentRow: number, currentCol: number) => {
    if(FLAG.stop === 1) {
      console.log("Stopping orb usage");
      return;
    }

    // Move to next item in grid (go down first, then right)
    let nextRow = currentRow + 1;
    let nextCol = currentCol;

    if (nextRow >= grid.height) {
      nextRow = 0;
      nextCol++;
    }

    if (nextCol >= grid.width) {
      // Finished all items in grid
      console.log("res", res);
      console.log("Finished processing all items in stash grid");
      isRunning = false;
      return;
    }

    processStashItem(nextRow, nextCol);
  };

  const startOrbProcess = async () => {
    overlay.assertGameActive();

    // // First, click on the orb to select it
    // console.log(
    //   `Selecting ${orbType} orb at position (${orbPosition.x}, ${orbPosition.y})...`
    // );
    // await mouse.move([new Point(orbPosition.x, orbPosition.y)]);
    // await new Promise((resolve) => setTimeout(resolve, 100));
    // await mouse.leftClick(); // Left click to select orb

    // Wait a bit for orb selection
    // await new Promise((resolve) => setTimeout(resolve, 200));

    // Hold Shift for multiple uses
    console.log("Holding Shift for multiple orb usage...");
    // uIOhook.keyToggle(Key.Shift, "down");

    // Start processing items from the beginning
    processStashItem(0, 0);
  };

  startOrbProcess();

  // Return a function to stop the process
  return () => {
    isRunning = false;
    uIOhook.keyToggle(Key.Shift, "up"); // Release Shift
  };
}

