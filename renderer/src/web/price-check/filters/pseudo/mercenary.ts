import { Stat, MercenaryBuild, stat } from '@/assets/data'
import { ItemCategory, ParsedItem } from '@/parser'
import { ModifierType, StatSource } from '@/parser/modifiers'
import { findAndResolveByRef, metaNotFilter } from './utils'
import { propToFilter } from './item-property'
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

  const rules = BUILD_RULES.find(rule => rule.build === item.mercenaryBuild!.refName)
  const mercenaryBuild = item.mercenaryBuild!.mercenaryBuild! as MercenaryBuild

  for (let [skill, ...supports] of item.mercenarySkills!) {
    const rawSupports = supports
    supports = rawSupports.filter(support =>
      !support.stat.mercenary!.syntheticFamily || support.stat.mercenary!.tier === 3)

    const skillType = mercenaryBuild.skills.find(buildSkill =>
      buildSkill.name === skill.stat.ref)!.type
    const skillFilter = skillToFilter({
      stat: skill.stat,
      type: skillType,
      disabled: true,
      badSkills: rules?.badSkills
    })

    if (!supports.length) {
      if (skillType === 'primary' && !rawSupports.length) {
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

    supports.sort((a, b) => {
      // bitwise AND changes tier 4 to 0, so it goes at the very end
      return (b.stat.mercenary!.tier! & 0x3) - (a.stat.mercenary!.tier! & 0x3)
    })

    const possibleSupports = (skill.stat.mercenary!.supports ?? []).map<Stat[]>(familyName => {
      const familyStat = findGemByRef(familyName)
      if (familyStat.modFamily) {
        return familyStat.modFamily.map(name => findGemByRef(name))
      } else {
        return [familyStat]
      }
    })

    if (supports.length === 5 && possibleSupports.length) {
      const tier3Count = supports.filter(support => support.stat.mercenary!.tier! >= 3).length
      filterGroup.stats.push(propToFilter({
        ref: '6-Link',
        tradeId: 'item.mercenary_6link',
        roll: { min: 0, max: 5, value: tier3Count },
        sources: possibleSupports.map(family => encodeFamilyToSource(family)),
        disabled: true
      }, { filters: [], item, searchInRange: 0, statsByType: [] }))
    }

    for (const support of supports) {
      const tier = support.stat.mercenary!.tier!

      let tradeId: StatFilter['tradeId']
      if (!support.stat.modFamily || tier === 3) {
        tradeId = support.stat.trade.ids[ModifierType.Pseudo]
      } else {
        tradeId = []
        for (const ref of support.stat.modFamily) {
          const familyStat = findGemByRef(ref)
          if (familyStat.mercenary!.tier! >= tier) {
            tradeId.push(...familyStat.trade.ids[ModifierType.Pseudo])
          }
        }
      }

      let canonStat = support.stat
      if (support.stat.mercenary!.canonical) {
        canonStat = findGemByRef(support.stat.mercenary!.canonical)
      }

      filterGroup.stats.push({
        tradeId: tradeId,
        statRef: canonStat.ref,
        text: canonStat.matchers[0].string,
        tag: FilterTag.MercenarySupport,
        mercenary: { tier: tier },
        sources: [],
        option: { value: SearchMode.Required },
        disabled: true
      })
    }

    if (supports.length === 5 && possibleSupports.length) {
      for (const family of possibleSupports) {
        const linked = family[0].mercenary!.canonical
          ? rawSupports.some(support => support.stat.mercenary!.canonical === family[0].mercenary!.canonical)
          : rawSupports.some(support => support.stat.ref === family[0].ref)
        if (linked) continue

        let canonStat = family[0]
        if (family[0].mercenary!.canonical) {
          canonStat = family.find(support => support.ref === family[0].mercenary!.canonical)!
        }

        filterGroup.stats.push({
          tradeId: family.flatMap(support => support.trade.ids[ModifierType.Pseudo]),
          statRef: canonStat.ref,
          text: canonStat.matchers[0].string,
          tag: FilterTag.MercenarySupport,
          sources: [],
          not: true,
          disabled: true
        })
      }
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

  for (const buildSkill of mercenaryBuild.skills) {
    if (item.mercenarySkills!.some(group =>
      group[0].stat.ref === buildSkill.name)) continue

    const filter = skillToFilter({
      stat: findGemByRef(buildSkill.name),
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

export enum SearchMode {
  Optional = 0,
  Required = 1
}

function findGemByRef (name: string): Stat {
  return findAndResolveByRef(name, ModifierType.Pseudo, ItemCategory.MercenaryWarrant)
}

function encodeFamilyToSource (family: Stat[]): StatSource {
  return {
    modifier: {
      info: undefined!,
      stats: family.map(stat => ({ stat: stat, translation: undefined! }))
    },
    stat: undefined!
  }
}

export function decodeFamilyFromSource (source: StatSource): Stat[] {
  return source.modifier.stats.map(stat => stat.stat)
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
