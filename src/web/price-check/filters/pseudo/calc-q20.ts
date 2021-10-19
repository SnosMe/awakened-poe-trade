import { ParsedItem } from '@/parser'
import { stat } from '@/assets/data'
import { statSourcesTotal } from '@/parser/modifiers'

export const QUALITY_STATS = {
  ARMOUR: {
    flat: stat('+# to Armour'),
    incr: [
      stat('#% increased Armour'),
      stat('#% increased Armour and Energy Shield'),
      stat('#% increased Armour and Evasion'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  EVASION: {
    flat: stat('+# to Evasion Rating'),
    incr: [
      stat('#% increased Evasion Rating'),
      stat('#% increased Armour and Evasion'),
      stat('#% increased Evasion and Energy Shield'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  ENERGY_SHIELD: {
    flat: stat('+# to maximum Energy Shield'),
    incr: [
      stat('#% increased Energy Shield'),
      stat('#% increased Armour and Energy Shield'),
      stat('#% increased Evasion and Energy Shield'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  WARD: {
    flat: stat('+# to Ward'),
    incr: [
      stat('#% increased Ward')
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
  statRefs: { flat: string, incr: string[] },
  item: ParsedItem
): number {
  let incr = 0
  let flat = 0

  for (const calc of item.statsByType) {
    const roll = statSourcesTotal(calc.sources)!
    if (calc.stat.ref === statRefs.flat) {
      flat = roll.value
    } else if (statRefs.incr.includes(calc.stat.ref)) {
      incr += roll.value
    }
  }

  const base = calcBase(total, incr, flat, item.quality)
  return calcQ20(base, incr, flat, item.quality)
}

function calcBase (total: number, incr: number, flat: number, quality: number | undefined) {
  return (total / (1 + incr / 100 + (quality || 0) / 100)) - flat
}

function calcQ20 (base: number, incr: number, flat: number, quality: number | undefined) {
  return (base + flat) * (1 + incr / 100 + Math.max(20, quality || 0) / 100)
}
