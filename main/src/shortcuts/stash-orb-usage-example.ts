// Example configuration for automatic stash orb usage
// This file demonstrates how to set up shortcuts for automatic orb usage on multiple stash items
//
// Import the orb usage functions from the dedicated orb-usage module
import { useOrbOnStashItemsWithOrbSelection } from "./orb-usage";
import type { ShortcutAction } from "../../../ipc/types";

// Example 1: Use Alteration Orbs on stash items until they have elemental resistance
export const stashAlterationOrbExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + Shift + A",
  action: {
    type: "use-orb-stash",
    orbType: "alteration",
    skipPattern: "\\+#% to all Elemental Resistances", // Stop when item has elemental resistance
    maxAttempts: 200,
    delayBetweenItems: 500,
    delayBetweenClicks: 100,
    orbPosition: { x: 50, y: 50 }, // Position of your alteration orb in inventory
    stashGrid: {
      startX: 200, // X position of top-left stash slot
      startY: 150, // Y position of top-left stash slot
      width: 12, // Number of columns in stash
      height: 12, // Number of rows in stash
      itemSize: 40, // Size of each item slot in pixels
    },
  },
};

// Example 2: Use Chaos Orbs on stash items until they have multiple desired mods
export const stashChaosOrbExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + Shift + C",
  action: {
    type: "use-orb-stash",
    orbType: "chaos",
    skipPattern:
      "\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed", // Stop when item has both res and attack speed
    maxAttempts: 300,
    delayBetweenItems: 600,
    delayBetweenClicks: 150,
    orbPosition: { x: 100, y: 50 }, // Position of your chaos orb in inventory
    stashGrid: {
      startX: 200,
      startY: 150,
      width: 12,
      height: 12,
      itemSize: 40,
    },
  },
};

// Example 3: Use Alteration Orbs for weapon crafting in stash
export const stashWeaponModExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + Shift + W",
  action: {
    type: "use-orb-stash",
    orbType: "alteration",
    skipPattern: "Adds # to # Physical Damage.*\\+#% increased Physical Damage", // Stop when weapon has both flat and % phys damage
    maxAttempts: 150,
    delayBetweenItems: 400,
    delayBetweenClicks: 120,
    orbPosition: { x: 150, y: 50 }, // Position of your alteration orb in inventory
    stashGrid: {
      startX: 200,
      startY: 150,
      width: 12,
      height: 12,
      itemSize: 40,
    },
  },
};

// Example 4: Use Chaos Orbs for complex item setup in stash
export const stashComplexItemExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + Shift + X",
  action: {
    type: "use-orb-stash",
    orbType: "chaos",
    skipPattern:
      "\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed.*\\+#% increased Cast Speed", // Stop when item has res, attack speed, and cast speed
    maxAttempts: 500,
    delayBetweenItems: 800,
    delayBetweenClicks: 200,
    orbPosition: { x: 200, y: 50 }, // Position of your chaos orb in inventory
    stashGrid: {
      startX: 200,
      startY: 150,
      width: 12,
      height: 12,
      itemSize: 40,
    },
  },
};

// Common stash grid configurations for different stash types:

// Standard stash tab (12x12)
export const standardStashGrid = {
  startX: 200, // Adjust based on your stash position
  startY: 150, // Adjust based on your stash position
  width: 12,
  height: 12,
  itemSize: 40,
};

// Premium stash tab (12x12)
export const premiumStashGrid = {
  startX: 200, // Adjust based on your stash position
  startY: 150, // Adjust based on your stash position
  width: 12,
  height: 12,
  itemSize: 40,
};

// Quad stash tab (24x24)
export const quadStashGrid = {
  startX: 200, // Adjust based on your stash position
  startY: 150, // Adjust based on your stash position
  width: 24,
  height: 24,
  itemSize: 40,
};

// Common orb positions (adjust based on your inventory layout):
export const orbPositions = {
  alteration: { x: 50, y: 50 }, // Top-left of inventory
  chaos: { x: 100, y: 50 }, // Second slot from left
  alchemy: { x: 150, y: 50 }, // Third slot from left
  scouring: { x: 200, y: 50 }, // Fourth slot from left
  augmentation: { x: 250, y: 50 }, // Fifth slot from left
};

// Common regex patterns for different item types:
// These patterns match what you WANT the item to have (when item matches, stop using orbs)

// Elemental Resistance patterns
export const resistancePatterns = {
  allRes: /\+#% to all Elemental Resistances/,
  fireRes: /\+#% to Fire Resistance/,
  coldRes: /\+#% to Cold Resistance/,
  lightningRes: /\+#% to Lightning Resistance/,
  chaosRes: /\+#% to Chaos Resistance/,
};

// Attack patterns
export const attackPatterns = {
  attackSpeed: /\+#% increased Attack Speed/,
  physicalDamage: /\+#% increased Physical Damage/,
  flatPhysDamage: /Adds # to # Physical Damage/,
  critChance: /\+#% to Critical Strike Chance/,
  critMultiplier: /\+#% to Critical Strike Multiplier/,
};

// Defense patterns
export const defensePatterns = {
  life: /\+# to maximum Life/,
  energyShield: /\+# to maximum Energy Shield/,
  armour: /\+#% increased Armour/,
  evasion: /\+#% increased Evasion Rating/,
  block: /\+#% Chance to Block/,
};

// Spell patterns
export const spellPatterns = {
  castSpeed: /\+#% increased Cast Speed/,
  spellDamage: /\+#% increased Spell Damage/,
  elementalDamage: /\+#% increased Elemental Damage/,
  fireDamage: /\+#% increased Fire Damage/,
  coldDamage: /\+#% increased Cold Damage/,
  lightningDamage: /\+#% increased Lightning Damage/,
};

// Usage instructions:
// 1. Add one of these shortcut configurations to your config file
// 2. Adjust the stashGrid coordinates to match your stash position
// 3. Adjust the orbPosition to match where your orbs are in inventory
// 4. Make sure you have enough orbs in your inventory
// 5. Open the stash tab you want to process
// 6. Press the configured hotkey
// 7. The function will automatically:
//    - Click on the orb to select it
//    - Hold Shift for multiple uses
//    - Move through each stash slot
//    - Check if item matches pattern
//    - Use orb on items that don't match
//    - Skip items that already match
//
// Important notes:
// - The regex patterns are case-sensitive and must match the exact text from the item
// - Use .* to match any text between patterns
// - Test your patterns on actual items first to ensure they work correctly
// - The function will stop if max attempts is reached
// - Make sure you have enough orbs in your inventory before starting
// - The skip pattern should match what you WANT the item to have (when item matches, it's already good)
// - Adjust stashGrid coordinates based on your screen resolution and UI scale
// - Adjust itemSize based on your UI scale (default 40px, may need to be 32px or 48px)
