import { ModifierType, StatCalculated } from '@/parser/modifiers'
import type { ParsedItem } from '@/parser'
import type { StatFilter } from '../interfaces'

const OILS = [
  'Clear Oil',
  'Sepia Oil',
  'Amber Oil',
  'Verdant Oil',
  'Teal Oil',
  'Azure Oil',
  'Indigo Oil',
  'Violet Oil',
  'Crimson Oil',
  'Black Oil',
  'Opalescent Oil',
  'Silver Oil',
  'Golden Oil'
]

export function decodeOils (calc: StatCalculated): string[] | undefined {
  if (calc.type !== ModifierType.Enchant) return

  // try Amulet enchant
  let encoded = calc.sources[0].stat.translation.oils
  // else try Ring enchant
  if (!encoded && calc.stat.anointments) {
    if (calc.stat.anointments.length === 1) {
      encoded = calc.stat.anointments[0].oils
    } else {
      encoded = calc.stat.anointments.find(anoint =>
        anoint.roll === calc.sources[0].stat.roll?.value)?.oils
    }
  }
  if (!encoded) return

  const decoded = encoded
    .split(',')
    .map(Number)
    .sort((a, b) => b - a) // [Golden Oil ... Clear Oil]
    .map(idx => OILS[idx])

  return decoded
}

export function applyAnointmentRules (filters: StatFilter[], item: ParsedItem) {
  const anointment = filters.find(filter => filter.oils)
  if (!anointment) return

  if (item.talismanTier) {
    anointment.disabled = false
  } else if (!item.isCorrupted && !item.isMirrored) {
    const oils = anointment.oils!
    if (oils[0] !== 'Golden Oil' && oils[0] !== 'Silver Oil') {
      anointment.hidden = 'filters.hide_anointment'
      anointment.disabled = true
    }
  }
}
