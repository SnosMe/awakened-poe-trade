import { ModifierType, StatCalculated } from '@/parser/modifiers'

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
