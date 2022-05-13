import { ParsedItem } from '@/parser'
import { stat } from '@/assets/data'
import { StatRoll, statSourcesTotal } from '@/parser/modifiers'

export const QUALITY_STATS = {
  ARMOUR: {
    flat: [stat('+# to Armour')],
    incr: [
      stat('#% increased Armour'),
      stat('#% increased Armour and Energy Shield'),
      stat('#% increased Armour and Evasion'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  EVASION: {
    flat: [stat('+# to Evasion Rating')],
    incr: [
      stat('#% increased Evasion Rating'),
      stat('#% increased Armour and Evasion'),
      stat('#% increased Evasion and Energy Shield'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  ENERGY_SHIELD: {
    flat: [stat('+# to maximum Energy Shield')],
    incr: [
      stat('#% increased Energy Shield'),
      stat('#% increased Armour and Energy Shield'),
      stat('#% increased Evasion and Energy Shield'),
      stat('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  WARD: {
    flat: [stat('+# to Ward')],
    incr: [
      stat('#% increased Ward')
    ]
  },
  PHYSICAL_DAMAGE: {
    flat: [stat('Adds # to # Physical Damage')],
    incr: [
      stat('#% increased Physical Damage')
    ]
  }
}

export function propAt20Quality (
  total: number,
  statRefs: { flat: string[], incr: string[] },
  item: ParsedItem
): StatRoll {
  const { incr, flat } = calcPropBase(statRefs, item)
  const base = calcBase(total, incr.value + (item.quality ?? 0), flat.value)
  const quality = Math.max(20, item.quality ?? 0)
  return {
    value: calcIncreased(base + flat.value, incr.value + quality),
    min: calcIncreased(base + flat.min, incr.min + quality),
    max: calcIncreased(base + flat.max, incr.max + quality)
  }
}

export function calcPropBounds (
  total: number,
  statRefs: { flat: string[], incr: string[] },
  item: ParsedItem
): StatRoll {
  const { incr, flat } = calcPropBase(statRefs, item)
  const base = calcBase(total, incr.value, flat.value)
  return {
    value: calcIncreased(base + flat.value, incr.value),
    min: calcIncreased(base + flat.min, incr.min),
    max: calcIncreased(base + flat.max, incr.max)
  }
}

function calcPropBase (
  statRefs: { flat: string[], incr: string[] },
  item: ParsedItem
) {
  const incr: StatRoll = { value: 0, min: 0, max: 0 }
  const flat: StatRoll = { value: 0, min: 0, max: 0 }

  for (const calc of item.statsByType) {
    let total: StatRoll
    if (statRefs.flat.includes(calc.stat.ref)) {
      total = flat
    } else if (statRefs.incr.includes(calc.stat.ref)) {
      total = incr
    } else {
      continue
    }
    const roll = statSourcesTotal(calc.sources)!
    total.value += roll.value
    total.min += roll.min
    total.max += roll.max
  }

  return { incr, flat }
}

function calcBase (total: number, incr: number, flat: number) {
  return (total / (1 + incr / 100)) - flat
}

function calcIncreased (flat: number, incr: number) {
  return flat * (1 + incr / 100)
}
