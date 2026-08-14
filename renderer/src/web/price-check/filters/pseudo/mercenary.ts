import { Stat, MercenaryBuild, stat } from '@/assets/data'
import { ItemCategory, ParsedItem } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import { findAndResolveByRef, metaNotFilter } from './utils'
import { FilterTag, FilterOrGroup, FilterGroup, StatFilter } from '../interfaces'

const BUILD_RULES = [{
  build: 'Kineticist',
  badSkills: [
    stat('Kinetic Bolt')
  ]
}, {
  build: 'Manyshot',
  badSkills: [
    stat('Icicle Rain')
  ]
}, {
  build: 'Combatant',
  badSkills: [
    stat('Wild Strike'),
    stat('Spectral Helix')
  ]
}]

export function createMercenaryFilters (item: ParsedItem): FilterOrGroup[] {
  const out: FilterOrGroup[] = []

  const rules = BUILD_RULES.find(rule => rule.build === item.mercenaryBuild!.name)

  for (const group of item.mercenarySkills!) {
    const [skill, ...supports] = group

    const skillType = item.mercenaryBuild!.skills.find(buildSkill =>
      buildSkill.name === skill.stat.ref)!.type
    const skillFilter = skillToFilter({
      stat: skill.stat,
      type: skillType,
      disabled: true,
      badSkills: rules?.badSkills
    })

    if (!supports.length) {
      if (skillType === 'primary') {
        skillFilter.hidden = 'filters.mercenary_primary_no_support'
      }
      out.push(skillFilter)
      continue
    }

    const filterGroup: FilterGroup = {
      group: 'mercenary',
      expanded: false,
      meta: skillFilter,
      stats: []
    }

    for (const support of supports) {
      const tier = support.stat.mercenary!.supportTier!

      let tradeId: StatFilter['tradeId']
      if (!support.stat.modFamily || tier === 3) {
        tradeId = support.stat.trade.ids[ModifierType.Pseudo]
      } else {
        tradeId = []
        for (const ref of support.stat.modFamily) {
          const stat = findAndResolveByRef(ref, ModifierType.Pseudo, ItemCategory.MercenaryWarrant)
          if (stat.mercenary!.supportTier! >= tier) {
            tradeId.push(...stat.trade.ids[ModifierType.Pseudo])
          }
        }
      }

      filterGroup.stats.push({
        tradeId: tradeId,
        statRef: support.stat.ref,
        text: support.translation.string,
        tag: FilterTag.Pseudo,
        sources: [],
        disabled: true
      })
    }

    out.push(filterGroup)
  }

  const notGroup: FilterGroup = {
    group: 'not',
    expanded: false,
    meta: metaNotFilter({ disabled: true }),
    stats: []
  }
  out.push(notGroup)

  for (const buildSkill of item.mercenaryBuild!.skills) {
    if (item.mercenarySkills!.some(group =>
      group[0].stat.ref === buildSkill.name)) continue

    const filter = skillToFilter({
      stat: findAndResolveByRef(buildSkill.name, ModifierType.Pseudo, ItemCategory.MercenaryWarrant),
      type: buildSkill.type,
      disabled: true,
      badSkills: rules?.badSkills
    })
    if (filter.tag === FilterTag.Brick) {
      filter.disabled = false
    }
    notGroup.stats.push(filter)
  }

  if (notGroup.stats.some(stat => !stat.disabled)) {
    notGroup.meta.disabled = false
  }

  return out
}

type SkillType = MercenaryBuild['skills'][number]['type']

function skillToFilter (opts: {
  stat: Stat
  type: SkillType
  disabled: boolean
  badSkills?: string[]
}): StatFilter {
  const filter: StatFilter = {
    tradeId: opts.stat.trade.ids[ModifierType.Pseudo],
    statRef: opts.stat.ref,
    text: opts.stat.matchers[0].string,
    tag: (opts.type === 'primary') ? FilterTag.MercenaryPrimary
      : (opts.type === 'secondary') ? FilterTag.MercenarySecondary
          : FilterTag.MercenaryUtility,
    mercenary: { icon: opts.stat.mercenary!.icon },
    sources: [],
    disabled: opts.disabled
  }

  if (opts.badSkills?.includes(opts.stat.ref)) {
    filter.tag = FilterTag.Brick
  }

  return filter
}
