// Example configuration for automatic orb usage
// This file demonstrates how to set up shortcuts for automatic orb usage

import type { ShortcutAction } from "../../../ipc/types";

// Example 1: Use Alteration Orbs until item has a specific mod
export const alterationOrbExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + A",
  action: {
    type: "use-orb",
    orbType: "alteration",
    skipPattern: "\\+#% to all Elemental Resistances", // Stop when item has elemental resistance (item is already good)
    maxAttempts: 50,
    delayBetweenAttempts: 200,
    checkInterval: 300,
  },
};

// Example 2: Use Chaos Orbs until item has multiple desired mods
export const chaosOrbExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + C",
  action: {
    type: "use-orb",
    orbType: "chaos",
    skipPattern:
      "\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed", // Stop when item has both res and attack speed (item is already good)
    maxAttempts: 100,
    delayBetweenAttempts: 150,
    checkInterval: 400,
  },
};

// Example 3: Use Alteration Orbs for a specific weapon mod
export const weaponModExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + W",
  action: {
    type: "use-orb",
    orbType: "alteration",
    skipPattern: "Adds # to # Physical Damage.*\\+#% increased Physical Damage", // Stop when weapon has both flat and % phys damage (item is already good)
    maxAttempts: 75,
    delayBetweenAttempts: 250,
    checkInterval: 350,
  },
};

// Example 4: Use Chaos Orbs for a complex item setup
export const complexItemExample: ShortcutAction = {
  shortcut: "Ctrl + Alt + X",
  action: {
    type: "use-orb",
    orbType: "chaos",
    skipPattern:
      "\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed.*\\+#% increased Cast Speed", // Stop when item has res, attack speed, and cast speed (item is already good)
    maxAttempts: 200,
    delayBetweenAttempts: 100,
    checkInterval: 500,
  },
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
// 2. Make sure the item you want to modify is in your inventory
// 3. Hover over the item with your mouse
// 4. Press the configured hotkey
// 5. The function will automatically use orbs until the item matches the pattern or max attempts is reached
//
// Important notes:
// - The regex patterns are case-sensitive and must match the exact text from the item
// - Use .* to match any text between patterns
// - Test your patterns on actual items first to ensure they work correctly
// - The function will stop if the item matches the skip pattern OR if max attempts is reached
// - Make sure you have enough orbs in your inventory before starting
// - The skip pattern should match what you WANT the item to have (when item matches, it's already good)
