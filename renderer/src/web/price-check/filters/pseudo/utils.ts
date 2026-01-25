import { Stat, STAT_BY_REF_V2 } from '@/assets/data'
import { ItemCategory } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import { _resolveTranslation } from '@/parser/stat-translations'
import { StatFilter, FilterTag } from '../interfaces'

type ResolveHint =
  | { expected: 'percent-merge', pick: 'percent' | 'value' }
  | { expected: 'flag-merge', pick: 'flag' | 'value' }

function _findAndResolveByRef (
  name: string,
  modType: ModifierType,
  itemCategory: ItemCategory | undefined,
  hint?: ResolveHint
): Stat | undefined {
  const statOrGroup = STAT_BY_REF_V2(name)
  if (!statOrGroup) return undefined

  let stat: Stat | undefined
  if (!('stats' in statOrGroup)) {
    stat = statOrGroup
  } else {
    const { resolve, stats } = statOrGroup
    if (resolve.strat === 'select' || resolve.strat === 'trivial-merge') {
      stat = _resolveTranslation(statOrGroup, { matchStr: '', itemCategory, modType, roll: undefined })
    } else {
      if (!hint || hint.expected !== resolve.strat) return undefined
      if (resolve.strat === 'percent-merge') {
        // NOTE 'value' stat can actually be a flag
        stat = stats[resolve.kind.indexOf(hint.pick === 'percent' ? 'percent' : 'value')]
      } else if (resolve.strat === 'flag-merge') {
        stat = stats[resolve.kind.indexOf(hint.pick === 'flag' ? 'flag' : 'value')]
      }
    }
  }
  if (stat && (modType in stat.trade.ids)) {
    return stat
  }
  return undefined
}

export function findAndResolveByRef (
  name: string,
  itemCategory: ItemCategory | undefined,
  hint?: ResolveHint
): Stat {
  const stat = _findAndResolveByRef(name, ModifierType.Explicit, itemCategory, hint)
  if (!stat) {
    throw new Error(`Unexpected stat shape: ${name}`)
  }
  return stat
}

export function explicitStatToNotFilter (opts: {
  stat: Stat
  negateString?: boolean
  disabled: StatFilter['disabled']
}): StatFilter {
  return {
    tradeId: opts.stat.trade.ids[ModifierType.Explicit],
    statRef: opts.stat.ref,
    text: (opts.stat.matchers.find(
      matcher => Boolean(matcher.negate) === Boolean(opts.negateString)
    ) ?? opts.stat.matchers[0]).string,
    tag: FilterTag.Explicit,
    sources: [],
    disabled: opts.disabled,
    not: true
  }
}
