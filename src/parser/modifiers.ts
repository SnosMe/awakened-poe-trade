import type { Stat, StatMatcher } from '@/assets/data'

export enum ModifierType {
  Pseudo = 'pseudo',
  Explicit = 'explicit',
  Implicit = 'implicit',
  Crafted = 'crafted',
  Enchant = 'enchant',
  Veiled = 'veiled',
  Fractured = 'fractured'
}

export interface LegacyItemModifier extends
  Stat,
  Pick<StatMatcher, 'string' | 'negate'> {
  value?: number
  bounds?: {
    min: number
    max: number
  }
  type: ModifierType
  corrupted?: true
}

export { LegacyItemModifier as ItemModifier }
