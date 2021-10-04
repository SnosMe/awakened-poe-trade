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
  Pick<StatMatcher, 'string' | 'negate'> {
  stat: Pick<Stat, 'ref' | 'trade' | 'dp' /* TODO remove `dp` */>
  value?: number
  bounds?: {
    min: number
    max: number
  }
  type: ModifierType
  corrupted?: true
}

export { LegacyItemModifier as ItemModifier }
