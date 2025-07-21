import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import { mouse, Point } from "@nut-tree-fork/nut-js";
import type { HostClipboard } from "./HostClipboard";
import type { OverlayWindow } from "../windowing/OverlayWindow";

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

export function useOrbOnStashItems(
  options: OrbUsageOptions,
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  const {
    orbType,
    skipPattern,
    maxAttempts = 100,
    delayBetweenItems = 500,
    delayBetweenClicks = 100,
    stashGrid,
  } = options;

  let attempts = 0;
  let isRunning = true;

  // Always use the STASH constant for grid calculations  
  const grid = {
    startX: STASH.start.x,
    startY: STASH.start.y,
    width: Math.floor((STASH.end.x - STASH.start.x) / STASH.gridSize),
    height: Math.floor((STASH.end.y - STASH.start.y) / STASH.gridSize),
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
      console.log(`Processing item at grid position (${row}, ${col}) -> screen position (${itemX}, ${itemY})`);

      // Move mouse to item using nut-js
      await mouse.move([new Point(itemX, itemY)]);

      // Wait a bit for the item tooltip to appear
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Copy item text to check if it matches pattern
      if (skipPattern) {
        try {
          const itemText = await clipboard.readItemText();
          let shouldSkip = false;
          if (typeof skipPattern === 'string') {
            shouldSkip = itemText.includes(skipPattern);
          } else {
            shouldSkip = skipPattern.test(itemText);
          }
          
          if (shouldSkip) {
            console.log(
              `Item at (${row}, ${col}) matches pattern, skipping...`
            );
            // Move to next item
            setTimeout(() => processNextItem(row, col), delayBetweenItems);
            return;
          }
        } catch (error) {
          console.log("Failed to read item text for pattern check:", error);
        }
      }

      // Item doesn't match pattern, use orb on it
      console.log(`Using ${orbType} orb on item at (${row}, ${col})`);

      // Click to use orb (Shift should already be held)
      await mouse.leftClick();

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
    // Move to next item in grid (go down first, then right)
    let nextRow = currentRow + 1;
    let nextCol = currentCol;

    if (nextRow >= grid.height) {
      nextRow = 0;
      nextCol++;
    }

    if (nextCol >= grid.width) {
      // Finished all items in grid
      console.log("Finished processing all items in stash grid");
      isRunning = false;
      return;
    }

    processStashItem(nextRow, nextCol);
  };

  const startOrbProcess = async () => {
    overlay.assertGameActive();

    // First, click on the orb to select it
    console.log(`Selecting ${orbType} orb...`);
    // You'll need to provide the orb position or implement orb selection
    // For now, assuming orb is already selected or in a known position

    // Hold Shift for multiple uses
    console.log("Holding Shift for multiple orb usage...");
    uIOhook.keyToggle(Key.Shift, "down");

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

const MOUSE_TIMEOUT = 100;

export async function useOrbOnStashItemsWithOrbSelection(
  options: OrbUsageOptions & { orbPosition: { x: number; y: number } },
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  const {
    orbType,
    skipPattern,
    maxAttempts = 100,
    delayBetweenItems = 500,
    delayBetweenClicks = 100,
    stashGrid,
    orbPosition,
  } = options;

  FLAG.stop = 0;

  let attempts = 0;
  let isRunning = true;

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

      // Copy item text to check if it matches pattern
      if (true) {
        try {
          
          

          const itemText = await clipboard.readItemText();
          console.log("itemText", itemText);
          let shouldSkip = false;
          if (typeof skipPattern === 'string') {
            shouldSkip = itemText.includes(skipPattern);
          } else {
            // shouldSkip = skipPattern.test(itemText);
          }
          
          if (shouldSkip) {
            console.log(
              `Item at (${row}, ${col}) matches pattern, skipping...`
            );
            // Move to next item
            setTimeout(() => processNextItem(row, col), delayBetweenItems);
            return;
          }
        } catch (error) {
          console.log("Failed to read item text for pattern check:", error);
        }
      }

      // Item doesn't match pattern, use orb on it
      // console.log(`Using ${orbType} orb on item at (${row}, ${col})`);

      // Click to use orb (Shift should already be held)
      await mouse.leftClick();

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
    // Move to next item in grid (go down first, then right)
    let nextRow = currentRow + 1;
    let nextCol = currentCol;

    if (nextRow >= grid.height) {
      nextRow = 0;
      nextCol++;
    }

    if (nextCol >= grid.width) {
      // Finished all items in grid
      console.log("Finished processing all items in stash grid");
      isRunning = false;
      return;
    }

    processStashItem(nextRow, nextCol);
  };

  const startOrbProcess = async () => {
    overlay.assertGameActive();

    // First, click on the orb to select it
    console.log(
      `Selecting ${orbType} orb at position (${orbPosition.x}, ${orbPosition.y})...`
    );
    await mouse.move([new Point(orbPosition.x, orbPosition.y)]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await mouse.leftClick(); // Left click to select orb

    // Wait a bit for orb selection
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Hold Shift for multiple uses
    console.log("Holding Shift for multiple orb usage...");
    uIOhook.keyToggle(Key.Shift, "down");

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

// Legacy function for single item usage (kept for backward compatibility)
export function useOrbOnItem(
  options: OrbUsageOptions,
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  const {
    orbType,
    skipPattern,
    maxAttempts = 100,
    delayBetweenAttempts = 100,
  } = options;

  let attempts = 0;

  const useOrb = async () => {
    if (attempts >= maxAttempts) {
      console.log(
        `Max attempts (${maxAttempts}) reached for ${orbType} orb usage`
      );
      return;
    }

    attempts++;

    // First, copy the current item to check if it matches our skip pattern
    if (skipPattern) {
      try {
        const itemText = await clipboard.readItemText();
        if (skipPattern.test(itemText)) {
          console.log(
            `Item matches desired pattern, skipping ${orbType} orb usage - item is already what you want!`
          );
          return; // Stop the process - item is already good
        }
      } catch (error) {
        console.log("Failed to read item text for pattern check:", error);
      }
    }

    // Use the appropriate orb only if item doesn't match the desired pattern
    if (orbType === "alteration") {
      // Use Orb of Alteration (Alt + Click)
      uIOhook.keyTap(Key.Alt, [Key.Alt]);
      uIOhook.keyTap(Key.Alt, []); // Release Alt
    } else if (orbType === "chaos") {
      // Use Chaos Orb (Shift + Click)
      uIOhook.keyTap(Key.Shift, [Key.Shift]);
      uIOhook.keyTap(Key.Shift, []); // Release Shift
    }

    // Wait before next attempt
    setTimeout(useOrb, delayBetweenAttempts);
  };

  overlay.assertGameActive();
  useOrb();
}

export function useOrbOnItemWithCheck(
  options: OrbUsageOptions & { checkInterval?: number },
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  const {
    orbType,
    skipPattern,
    maxAttempts = 100,
    delayBetweenAttempts = 100,
    checkInterval = 500,
  } = options;
  console.log("useOrbOnItemWithCheck", options);
  let attempts = 0;
  let isRunning = true;

  const checkAndUseOrb = async () => {
    if (!isRunning || attempts >= maxAttempts) {
      if (attempts >= maxAttempts) {
        console.log(
          `Max attempts (${maxAttempts}) reached for ${orbType} orb usage`
        );
      }
      return;
    }

    attempts++;

    try {
      // Copy the current item text
      const itemText = await clipboard.readItemText();
      console.log("itemText", itemText);

      // Check if item matches desired pattern - if it does, skip using orb
      if (skipPattern) {
        let shouldSkip = false;
        if (typeof skipPattern === 'string') {
          shouldSkip = itemText.includes(skipPattern);
        } else {
          shouldSkip = skipPattern.test(itemText);
        }
        
        if (shouldSkip) {
          console.log(
            `Item matches desired pattern, stopping ${orbType} orb usage - item is already what you want!`
          );
          isRunning = false;
          return; // Stop the process - item is already good
        }
      }

      // Use the appropriate orb only if item doesn't match the desired pattern
      if (orbType === "alteration") {
        // Use Orb of Alteration (Alt + Click)
        uIOhook.keyTap(Key.Alt, [Key.Alt]);
        uIOhook.keyTap(Key.Alt, []); // Release Alt
      } else if (orbType === "chaos") {
        // Use Chaos Orb (Shift + Click)
        uIOhook.keyTap(Key.Shift, [Key.Shift]);
        uIOhook.keyTap(Key.Shift, []); // Release Shift
      }

      // Schedule next check
      setTimeout(checkAndUseOrb, checkInterval);
    } catch (error) {
      console.log("Error during orb usage:", error);
      // Continue trying even if there's an error
      setTimeout(checkAndUseOrb, checkInterval);
    }
  };

  overlay.assertGameActive();
  checkAndUseOrb();

  // Return a function to stop the process
  return () => {
    isRunning = false;
  };
}
