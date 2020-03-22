import { ParsedItem } from '@/parser'
import { stat } from '@/assets/data'

export const QUALITY_STATS = {
  ARMOUR: {
    flat: stat('# to Armour'),
    incr: [
      stat('#% increased Armour'),
      stat('#% increased Armour and Energy Shield'),
      stat('#% increased Armour and Evasion'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  EVASION: {
    flat: stat('# to Evasion Rating'),
    incr: [
      stat('#% increased Evasion Rating'),
      stat('#% increased Armour and Evasion'),
      stat('#% increased Evasion and Energy Shield'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  ENERGY_SHIELD: {
    flat: stat('# to maximum Energy Shield'),
    incr: [
      stat('#% increased Energy Shield'),
      stat('#% increased Armour and Energy Shield'),
      stat('#% increased Evasion and Energy Shield'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  PHYSICAL_DAMAGE: {
    flat: stat('Adds # to # Physical Damage'),
    incr: [
      stat('#% increased Physical Damage')
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
  return calcQ20(base, incr, flat, item.quality)
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
    Math.round(calcQ20(base[0], incr, flat[0], item.quality)),
    Math.round(calcQ20(base[1], incr, flat[1], item.quality))
  ]
}

function calcBase (total: number, incr: number, flat: number, quality: number | undefined) {
  return Math.round((total / (1 + incr / 100 + (quality || 0) / 100)) - flat)
}

function calcQ20 (base: number, incr: number, flat: number, quality: number | undefined) {
  return (base + flat) * (1 + incr / 100 + Math.max(20, quality || 0) / 100)
}
