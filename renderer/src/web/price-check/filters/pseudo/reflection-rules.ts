import { stat } from '@/assets/data'
import type { StatFilter } from '../interfaces'

interface FilterRule {
  ref: string
  disabled?: boolean
  remove?: boolean
  hidden?: string
}

const RULES: FilterRule[] = [
  { ref: stat('Reflection of Flame (Difficulty #)'), remove: true }

]

export function applyRules (filters: StatFilter[]) {
  for (const filter of filters) {
    filter.disabled = true
  }

  for (const rule of RULES) {
    const index = filters.findIndex(filter => filter.statRef === rule.ref)
    if (index === -1) continue

    const filter = filters[index]
    if (rule.remove !== undefined) {
      filters.splice(index, 1)
      continue
    }

    if (rule.hidden !== undefined) {
      filter.hidden = rule.hidden
    }
    if (rule.disabled !== undefined) {
      filter.disabled = rule.disabled
    }
  }
}
