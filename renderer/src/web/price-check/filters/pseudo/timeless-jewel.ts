import { calculatedStatToFilter, FiltersCreationContext } from '../create-stat-filters'
import { sumStatsByModType } from '@/parser/modifiers'
import { FilterTag, FilterGroup } from '../interfaces'
import { findAndResolveByRef, metaCountOneFilter } from './utils'
import { StatBetter } from '@/assets/data'

export function filterTimelessJewelKeystones (ctx: FiltersCreationContext) {
  const treeSeedStat = ctx.statsByType.find(calc =>
    calc.stat.better === StatBetter.NotComparable &&
    calc.stat.modFamily != null)
  if (!treeSeedStat) return

  const group: FilterGroup = {
    group: 'one',
    expanded: true,
    meta: metaCountOneFilter({ disabled: false }),
    stats: []
  }

  for (const familyStatRef of treeSeedStat.stat.modFamily!) {
    let calc = treeSeedStat
    if (familyStatRef !== treeSeedStat.stat.ref) {
      const familyStat = findAndResolveByRef(familyStatRef, treeSeedStat.type, ctx.item.category)
      calc = sumStatsByModType([{
        info: treeSeedStat.sources[0].modifier.info,
        stats: [{
          stat: familyStat,
          translation: familyStat.matchers[0],
          roll: calc.sources[0].stat.roll
        }]
      }])[0]
    }
    const filter = calculatedStatToFilter(calc, ctx.searchInRange, ctx.item)
    if (familyStatRef !== treeSeedStat.stat.ref) {
      filter.tag = FilterTag.Pseudo
      filter.disabled = true
    }
    group.stats.push(filter)
  }

  ctx.statsByType = ctx.statsByType.filter(stat => stat !== treeSeedStat)
  ctx.groups.push(group)
}
