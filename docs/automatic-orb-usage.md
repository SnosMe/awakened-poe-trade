# Automatic Orb Usage

This feature allows you to automatically use Orbs of Alteration and Chaos Orbs on items until they match specific criteria defined by regex patterns.

## Overview

The automatic orb usage function can:

- Use Orbs of Alteration or Chaos Orbs automatically
- Check item properties after each orb usage
- **Skip using orbs when the item matches a specified regex pattern** (meaning the item is already what you want)
- Limit the number of attempts to prevent infinite loops
- Configure delays between attempts for optimal performance
- **Process multiple items in a stash tab** with mouse movement and clicking

## How It Works

The function works like the stash search feature:

1. **Check the item**: Read the current item's properties
2. **Test against pattern**: If the item matches your regex pattern, it means the item is already what you want
3. **Skip or continue**:
   - If item matches pattern → **Stop** (don't use orbs, item is already good)
   - If item doesn't match pattern → **Use orb** and try again

## Two Usage Modes

### 1. Single Item Mode (Legacy)

For using orbs on a single item in your inventory.

### 2. Stash Mode (New)

For using orbs on multiple items in a stash tab with automatic mouse movement.

## Configuration

### Single Item Mode

```json
{
  "shortcut": "Ctrl + Alt + A",
  "action": {
    "type": "use-orb",
    "orbType": "alteration",
    "skipPattern": "\\+#% to all Elemental Resistances",
    "maxAttempts": 50,
    "delayBetweenAttempts": 200,
    "checkInterval": 300
  }
}
```

### Stash Mode

```json
{
  "shortcut": "Ctrl + Alt + Shift + A",
  "action": {
    "type": "use-orb-stash",
    "orbType": "alteration",
    "skipPattern": "\\+#% to all Elemental Resistances",
    "maxAttempts": 200,
    "delayBetweenItems": 500,
    "delayBetweenClicks": 100,
    "orbPosition": { "x": 50, "y": 50 },
    "stashGrid": {
      "startX": 200,
      "startY": 150,
      "width": 12,
      "height": 12,
      "itemSize": 40
    }
  }
}
```

### Configuration Options

#### Single Item Mode

- **shortcut**: The hotkey combination to trigger the orb usage
- **action.type**: Must be `"use-orb"`
- **action.orbType**: Either `"alteration"` or `"chaos"`
- **action.skipPattern**: A regex pattern (as string) that, when matched, means the item is already what you want (stops orb usage)
- **action.maxAttempts**: Maximum number of orbs to use (default: 100)
- **action.delayBetweenAttempts**: Delay in milliseconds between orb uses (default: 100)
- **action.checkInterval**: Delay in milliseconds between item checks (default: 500)

#### Stash Mode

- **shortcut**: The hotkey combination to trigger the orb usage
- **action.type**: Must be `"use-orb-stash"`
- **action.orbType**: Either `"alteration"` or `"chaos"`
- **action.skipPattern**: A regex pattern (as string) that, when matched, means the item is already what you want (skips this item)
- **action.maxAttempts**: Maximum number of items to process (default: 100)
- **action.delayBetweenItems**: Delay in milliseconds between processing different items (default: 500)
- **action.delayBetweenClicks**: Delay in milliseconds between clicks (default: 100)
- **action.orbPosition**: X,Y coordinates of the orb in your inventory
- **action.stashGrid**: Configuration for the stash grid layout

#### Stash Grid Configuration

- **startX**: X coordinate of the top-left stash slot
- **startY**: Y coordinate of the top-left stash slot
- **width**: Number of columns in the stash (usually 12 for standard, 24 for quad)
- **height**: Number of rows in the stash (usually 12 for standard, 24 for quad)
- **itemSize**: Size of each item slot in pixels (usually 40, adjust for UI scale)

## Usage Instructions

### Single Item Mode

1. **Prepare your setup**:

   - Make sure you have enough orbs in your inventory
   - Place the item you want to modify in your inventory
   - Hover over the item with your mouse

2. **Press the hotkey**:
   - The function will check the item first
   - If the item already matches your pattern → **stops immediately** (item is already good)
   - If the item doesn't match → **uses orbs** until it matches or max attempts reached

### Stash Mode

1. **Prepare your setup**:

   - Make sure you have enough orbs in your inventory
   - Place orbs in a known position in your inventory
   - Open the stash tab you want to process
   - Adjust stashGrid coordinates to match your stash position

2. **Press the hotkey**:

   - The function will click on the orb to select it
   - Hold Shift for multiple uses
   - Move through each stash slot systematically
   - Check if each item matches your pattern
   - Use orb on items that don't match
   - Skip items that already match

3. **Monitor the process**:
   - Check the console/logs for status messages
   - The function will log when it stops and why

## Stash Mode Workflow

The stash mode follows this exact workflow:

1. **Select Orb**: Click on the orb at the specified position
2. **Hold Shift**: Press and hold Shift for multiple orb usage
3. **Process Grid**: Move through each stash slot in order:
   - Move mouse to item position
   - Wait for tooltip to appear
   - Copy item text
   - Check against regex pattern
   - If matches pattern → **Skip** (move to next item)
   - If doesn't match → **Click** to use orb (move to next item)
4. **Complete**: Stop when all items processed or max attempts reached
5. **Cleanup**: Release Shift key

## Regex Pattern Examples

### Single Mod Patterns

```json
// Stop when item has elemental resistance (item is already good)
"skipPattern": "\\+#% to all Elemental Resistances"

// Stop when item has attack speed (item is already good)
"skipPattern": "\\+#% increased Attack Speed"

// Stop when item has life (item is already good)
"skipPattern": "\\+[0-9]+ to maximum Life"
```

### Multiple Mod Patterns

```json
// Stop when item has both resistance and attack speed (item is already good)
"skipPattern": "\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed"

// Stop when item has life, resistance, and attack speed (item is already good)
"skipPattern": "\\+[0-9]+ to maximum Life.*\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed"
```

### Weapon-Specific Patterns

```json
// Stop when weapon has both flat and percentage physical damage (item is already good)
"skipPattern": "Adds [0-9]+ to [0-9]+ Physical Damage.*\\+#% increased Physical Damage"

// Stop when weapon has critical strike chance and multiplier (item is already good)
"skipPattern": "\\+#% to Critical Strike Chance.*\\+#% to Critical Strike Multiplier"
```

## Common Patterns

### Elemental Resistances

- `\\+#% to all Elemental Resistances` - All elemental resistances
- `\\+#% to Fire Resistance` - Fire resistance only
- `\\+#% to Cold Resistance` - Cold resistance only
- `\\+#% to Lightning Resistance` - Lightning resistance only
- `\\+#% to Chaos Resistance` - Chaos resistance only

### Attack Modifiers

- `\\+#% increased Attack Speed` - Attack speed
- `\\+#% increased Physical Damage` - Physical damage
- `Adds [0-9]+ to [0-9]+ Physical Damage` - Flat physical damage
- `\\+#% to Critical Strike Chance` - Critical strike chance
- `\\+#% to Critical Strike Multiplier` - Critical strike multiplier

### Defense Modifiers

- `\\+[0-9]+ to maximum Life` - Life
- `\\+[0-9]+ to maximum Energy Shield` - Energy shield
- `\\+#% increased Armour` - Armour
- `\\+#% increased Evasion Rating` - Evasion
- `\\+#% Chance to Block` - Block chance

### Spell Modifiers

- `\\+#% increased Cast Speed` - Cast speed
- `\\+#% increased Spell Damage` - Spell damage
- `\\+#% increased Elemental Damage` - Elemental damage
- `\\+#% increased Fire Damage` - Fire damage
- `\\+#% increased Cold Damage` - Cold damage
- `\\+#% increased Lightning Damage` - Lightning damage

## Important Notes

### Safety Features

- **Max Attempts**: Always set a reasonable `maxAttempts` to prevent infinite loops
- **Pattern Testing**: Test your regex patterns on actual items before using them
- **Orb Supply**: Make sure you have enough orbs before starting

### Pattern Guidelines

- **Case Sensitivity**: Patterns are case-sensitive and must match exact item text
- **Escaping**: Use `\\+` to match literal `+` characters
- **Wildcards**: Use `.*` to match any text between patterns
- **Numbers**: Use `[0-9]+` to match variable numbers
- **Desired Outcome**: The pattern should match what you want the item to have (not what you want to avoid)

### Performance Considerations

- **Delays**: Adjust `delayBetweenAttempts` and `checkInterval` based on your system performance
- **Game State**: Make sure the game is responsive and not lagging
- **Inventory**: Keep the item in a consistent location in your inventory

### Stash Mode Considerations

- **Grid Positioning**: Adjust stashGrid coordinates based on your screen resolution and UI scale
- **Item Size**: Adjust itemSize based on your UI scale (default 40px, may need to be 32px or 48px)
- **Orb Position**: Make sure the orbPosition matches where your orbs are in inventory
- **Stash Type**: Use appropriate grid size (12x12 for standard, 24x24 for quad)

## Troubleshooting

### Common Issues

1. **Function doesn't start**:

   - Check that the hotkey is properly configured
   - Ensure the game window is active
   - Verify the item is in your inventory and you're hovering over it (single mode)
   - Verify stash is open and orb position is correct (stash mode)

2. **Function stops immediately**:

   - This means your item already matches the pattern! The function is working correctly
   - If you want to modify the item further, adjust your regex pattern to be more specific
   - Test the pattern manually on the item to verify it matches

3. **Function doesn't stop**:

   - Check that your regex pattern is correct
   - Verify the pattern matches the item text exactly
   - Increase `maxAttempts` if needed

4. **Performance issues**:

   - Increase `delayBetweenAttempts` and `checkInterval`
   - Close other applications to free up system resources
   - Check if the game is running smoothly

5. **Stash mode issues**:
   - **Wrong grid position**: Adjust stashGrid coordinates
   - **Wrong orb position**: Adjust orbPosition coordinates
   - **Wrong item size**: Adjust itemSize for your UI scale
   - **Orb not found**: Make sure orbs are in the specified position

### Debugging

Enable debug logging to see what's happening:

- Check the application logs for status messages
- The function will log when it starts, stops, and why it stopped
- Look for error messages that might indicate issues

## Examples

### Basic Alteration Orb Usage (Single Item)

```json
{
  "shortcut": "Ctrl + Alt + A",
  "action": {
    "type": "use-orb",
    "orbType": "alteration",
    "skipPattern": "\\+#% to all Elemental Resistances",
    "maxAttempts": 50
  }
}
```

**Behavior**: Use alteration orbs until the item has elemental resistance, then stop.

### Advanced Chaos Orb Usage (Single Item)

```json
{
  "shortcut": "Ctrl + Alt + C",
  "action": {
    "type": "use-orb",
    "orbType": "chaos",
    "skipPattern": "\\+[0-9]+ to maximum Life.*\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed",
    "maxAttempts": 100,
    "delayBetweenAttempts": 150,
    "checkInterval": 400
  }
}
```

**Behavior**: Use chaos orbs until the item has life, elemental resistance, AND attack speed, then stop.

### Stash Alteration Orb Usage

```json
{
  "shortcut": "Ctrl + Alt + Shift + A",
  "action": {
    "type": "use-orb-stash",
    "orbType": "alteration",
    "skipPattern": "\\+#% to all Elemental Resistances",
    "maxAttempts": 200,
    "delayBetweenItems": 500,
    "delayBetweenClicks": 100,
    "orbPosition": { "x": 50, "y": 50 },
    "stashGrid": {
      "startX": 200,
      "startY": 150,
      "width": 12,
      "height": 12,
      "itemSize": 40
    }
  }
}
```

**Behavior**: Process all items in a 12x12 stash grid, using alteration orbs on items that don't have elemental resistance.

### Stash Chaos Orb Usage (Complex)

```json
{
  "shortcut": "Ctrl + Alt + Shift + C",
  "action": {
    "type": "use-orb-stash",
    "orbType": "chaos",
    "skipPattern": "\\+[0-9]+ to maximum Life.*\\+#% to all Elemental Resistances.*\\+#% increased Attack Speed",
    "maxAttempts": 300,
    "delayBetweenItems": 600,
    "delayBetweenClicks": 150,
    "orbPosition": { "x": 100, "y": 50 },
    "stashGrid": {
      "startX": 200,
      "startY": 150,
      "width": 12,
      "height": 12,
      "itemSize": 40
    }
  }
}
```

**Behavior**: Process all items in a 12x12 stash grid, using chaos orbs on items that don't have life, elemental resistance, AND attack speed.

## Safety Disclaimer

This feature automates the use of currency items in Path of Exile. Please use it responsibly:

- Always test patterns on cheap items first
- Set reasonable limits to prevent excessive orb usage
- Monitor the process to ensure it's working as expected
- Be aware that this is an automation tool and use it at your own risk
- The stash mode involves mouse movement and clicking - ensure your game window is properly positioned
