import { ParsedItem } from '../parser'
import { assertStat } from './cleanup'

export const QUALITY_STATS = {
  ARMOUR: {
    flat: assertStat('# to Armour'),
    incr: [
      assertStat('#% increased Armour'),
      assertStat('#% increased Armour and Energy Shield'),
      assertStat('#% increased Armour and Evasion'),
      assertStat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  EVASION: {
    flat: assertStat('# to Evasion Rating'),
    incr: [
      assertStat('#% increased Evasion Rating'),
      assertStat('#% increased Armour and Evasion'),
      assertStat('#% increased Evasion and Energy Shield'),
      assertStat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  ENERGY_SHIELD: {
    flat: assertStat('# to maximum Energy Shield'),
    incr: [
      assertStat('#% increased Energy Shield'),
      assertStat('#% increased Armour and Energy Shield'),
      assertStat('#% increased Evasion and Energy Shield'),
      assertStat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  PHYSICAL_DAMAGE: {
    flat: assertStat('Adds # to # Physical Damage'),
    incr: [
      assertStat('#% increased Physical Damage')
    ]
  }
}

export function propAt20Quality (
  total: number,
  stats: { flat: string, incr: string[] },
  item: ParsedItem
): number {
  let incr = 0
  let flat = 0

  for (const mod of item.modifiers) {
    if (mod.modInfo.text === stats.flat) {
      flat = mod.values![0]
    } else if (stats.incr.includes(mod.modInfo.text)) {
      incr += mod.values![0]
    }
  }

  const base = calcBase(total, incr, flat, item.quality)
  return calcQ20(base, incr, flat)
}

export function variablePropAt20Quality (
  total: number[],
  stats: { flat: string, incr: string[] },
  item: ParsedItem
): number[] {
  let incr = 0
  let flat = [0, 0]

  for (const mod of item.modifiers) {
    if (mod.modInfo.text === stats.flat) {
      flat = mod.values!
    } else if (stats.incr.includes(mod.modInfo.text)) {
      incr += mod.values![0]
    }
  }

  const base = [
    calcBase(total[0], incr, flat[0], item.quality),
    calcBase(total[1], incr, flat[1], item.quality)
  ]

  return [
    Math.round(calcQ20(base[0], incr, flat[0])),
    Math.round(calcQ20(base[1], incr, flat[1]))
  ]
}

function calcBase (total: number, incr: number, flat: number, quality: number | undefined) {
  return Math.round((total / (1 + incr / 100 + (quality || 0) / 100)) - flat)
}

function calcQ20 (base: number, incr: number, flat: number) {
  return (base + flat) * (1 + incr / 100 + 20 / 100)
}
