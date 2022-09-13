import { stat } from '@/assets/data'
import type { StatFilter } from '../interfaces'

interface FilterRule {
  ref: string
  disabled?: boolean
  difficulty?: 'any'
}

const RULES: FilterRule[] = [
  { ref: stat('Reflection of the Breachlord (Difficulty #)') },
  { ref: stat('Reflection of Delirium (Difficulty #)'), difficulty: 'any' },
  { ref: stat('Reflection of Tyranny (Difficulty #)') },
  { ref: stat('Reflection of the Trove (Difficulty #)') },
  { ref: stat('Reflection of Thralldom (Difficulty #)') },
  { ref: stat('Reflection of Phaaryl (Difficulty #)') },
  { ref: stat('Reflection of Perverted Faith (Difficulty #)') },
  { ref: stat('Reflection of Kalandra (Difficulty #)'), disabled: false },
  { ref: stat('Reflection of Experimentation (Difficulty #)') },
  { ref: stat('Reflection of the Sun (Difficulty #)'), disabled: false },
  { ref: stat('Reflection of the Monolith (Difficulty #)') },
  { ref: stat('Reflection of the Nightmare (Difficulty #)') },
  { ref: stat('Reflection of Azurite (Difficulty #)') },
  { ref: stat('Reflection of Paradise (Difficulty #)'), disabled: false },
  { ref: stat('Reflection of Angling (Difficulty #)'), disabled: false },
]

export function applyRules (filters: StatFilter[]) {
  for (let i = 0; i < filters.length;) {
    const filter = filters[i]
    const rule = RULES.find(rule => rule.ref === filter.statRef)
    if (!rule) {
      const difficulty = filter.roll!.value
      if (difficulty < 8) {
        filters.splice(i, 1)
        continue
      } else {
        filter.hidden = 'low_tier_reflection'
      }
    } else {
      if (rule.difficulty === 'any') {
        filter.roll = undefined
      }
      if (rule.disabled !== undefined) {
        filter.disabled = rule.disabled
      }
    }
    i += 1
  }
}
