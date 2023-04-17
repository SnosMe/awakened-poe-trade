import { stat, STAT_BY_REF } from '@/assets/data'
import { ModifierType, StatCalculated, StatSource } from '@/parser/modifiers'
import { calculatedStatToFilter, FiltersCreationContext } from '../create-stat-filters'
import type { StatFilter } from '../interfaces'

const RESISTANCES_INFO = [
  { ref: stat('+#% to all Elemental Resistances'), elements: ['fire', 'cold', 'lightning'] },
  { ref: stat('+#% to Fire Resistance'), elements: ['fire'] },
  { ref: stat('+#% to Cold Resistance'), elements: ['cold'] },
  { ref: stat('+#% to Lightning Resistance'), elements: ['lightning'] },
  { ref: stat('+#% to Fire and Lightning Resistances'), elements: ['fire', 'lightning'] },
  { ref: stat('+#% to Fire and Cold Resistances'), elements: ['fire', 'cold'] },
  { ref: stat('+#% to Cold and Lightning Resistances'), elements: ['cold', 'lightning'] },
  { ref: stat('+#% to Chaos Resistance'), elements: [], chaos: true },
  { ref: stat('+#% to Fire and Chaos Resistances'), elements: ['fire'], chaos: true },
  { ref: stat('+#% to Cold and Chaos Resistances'), elements: ['cold'], chaos: true },
  { ref: stat('+#% to Lightning and Chaos Resistances'), elements: ['lightning'], chaos: true }
]

const ATTRIBUTES_INFO = [
  { ref: stat('+# to all Attributes'), attributes: ['str', 'dex', 'int'] },
  { ref: stat('+# to Strength'), attributes: ['str'] },
  { ref: stat('+# to Dexterity'), attributes: ['dex'] },
  { ref: stat('+# to Intelligence'), attributes: ['int'] },
  { ref: stat('+# to Strength and Intelligence'), attributes: ['str', 'int'] },
  { ref: stat('+# to Strength and Dexterity'), attributes: ['str', 'dex'] },
  { ref: stat('+# to Dexterity and Intelligence'), attributes: ['dex', 'int'] }
]

interface PseudoRule {
  group?: string
  pseudo: string
  disabled?: boolean
  replaces?: string
  stats: Array<{
    ref: string
    multiplier?: number
    required?: boolean
  }>
  mutate?: (filter: StatFilter) => void
}

const PSEUDO_RULES: PseudoRule[] = [
  {
    pseudo: stat('+#% total Elemental Resistance'),
    disabled: false,
    stats:
      RESISTANCES_INFO.filter(info => info.elements.length)
        .map(info => ({ ref: info.ref, multiplier: info.elements.length }))
  },
  {
    pseudo: stat('+#% total to Fire Resistance'),
    group: 'to_x_ele_res',
    stats:
      RESISTANCES_INFO.filter(info => info.elements.includes('fire'))
        .map(info => ({ ref: info.ref }))
  },
  {
    pseudo: stat('+#% total to Cold Resistance'),
    group: 'to_x_ele_res',
    stats:
      RESISTANCES_INFO.filter(info => info.elements.includes('cold'))
        .map(info => ({ ref: info.ref }))
  },
  {
    pseudo: stat('+#% total to Lightning Resistance'),
    group: 'to_x_ele_res',
    stats:
      RESISTANCES_INFO.filter(info => info.elements.includes('lightning'))
        .map(info => ({ ref: info.ref }))
  },
  {
    pseudo: stat('+#% total to Chaos Resistance'),
    stats:
      RESISTANCES_INFO.filter(info => info.chaos === true)
        .map(info => ({ ref: info.ref })),
    mutate (filter) {
      if (filter.sources.length === 1 &&
          filter.sources[0].modifier.info.type === ModifierType.Crafted
      ) {
        filter.hidden = 'filters.hide_crafted_chaos'
      } else {
        filter.disabled = false
      }
    }
  },
  {
    pseudo: stat('+# total to all Attributes'),
    group: 'to_all_attrs',
    stats: [
      { ref: stat('+# to all Attributes') }
      // NOTE: not including other sources from `ATTRIBUTES_INFO`
    ]
  },
  {
    pseudo: stat('+# total to Strength'),
    group: 'to_x_attr',
    stats:
      ATTRIBUTES_INFO.filter(info => info.attributes.includes('str'))
        .map(info => ({ ref: info.ref }))
  },
  {
    pseudo: stat('+# total to Dexterity'),
    group: 'to_x_attr',
    stats:
      ATTRIBUTES_INFO.filter(info => info.attributes.includes('dex'))
        .map(info => ({ ref: info.ref }))
  },
  {
    pseudo: stat('+# total to Intelligence'),
    group: 'to_x_attr',
    stats:
      ATTRIBUTES_INFO.filter(info => info.attributes.includes('int'))
        .map(info => ({ ref: info.ref }))
  },
  {
    pseudo: stat('+# total maximum Life'),
    disabled: false,
    stats: [
      { ref: stat('+# to maximum Life'), required: true },
      ...ATTRIBUTES_INFO.filter(info => info.attributes.includes('str'))
        .map(info => ({ ref: info.ref, multiplier: 5 / 10 }))
    ]
  },
  {
    pseudo: stat('+# total maximum Mana'),
    stats: [
      { ref: stat('+# to maximum Mana'), required: true },
      ...ATTRIBUTES_INFO.filter(info => info.attributes.includes('int'))
        .map(info => ({ ref: info.ref, multiplier: 5 / 10 }))
    ]
  },
  {
    pseudo: stat('#% total increased maximum Energy Shield'),
    stats: [
      { ref: stat('#% increased maximum Energy Shield') }
    ]
  },
  {
    pseudo: stat('+# total maximum Energy Shield'),
    stats: [
      { ref: stat('+# to maximum Energy Shield') } // global
    ]
  },
  {
    pseudo: stat('+#% total Attack Speed'),
    stats: [
      { ref: stat('#% increased Attack Speed') } // global
      // { ref: stat('#% increased Attack and Cast Speed') }
    ]
  },
  {
    pseudo: stat('+#% total Cast Speed'),
    stats: [
      { ref: stat('#% increased Cast Speed') }
      // { ref: stat('#% increased Attack and Cast Speed') }
    ]
  },
  {
    pseudo: stat('#% increased Movement Speed'),
    stats: [
      { ref: stat('#% increased Movement Speed') }
    ]
  },
  {
    pseudo: stat('#% total increased Physical Damage'),
    stats: [
      { ref: stat('#% increased Global Physical Damage') }
    ]
  },
  {
    pseudo: stat('+#% Global Critical Strike Chance'),
    group: 'global_crit_chance',
    stats: [
      { ref: stat('#% increased Global Critical Strike Chance') }
    ]
  },
  {
    pseudo: stat('+#% total Critical Strike Chance for Spells'),
    replaces: 'global_crit_chance',
    stats: [
      { ref: stat('#% increased Critical Strike Chance for Spells'), required: true },
      { ref: stat('#% increased Global Critical Strike Chance') }
    ]
  },
  {
    pseudo: stat('+#% Global Critical Strike Multiplier'),
    stats: [
      { ref: stat('+#% to Global Critical Strike Multiplier') }
    ]
  },
  {
    pseudo: stat('#% increased Elemental Damage'),
    group: 'incr_ele_dmg',
    stats: [
      { ref: stat('#% increased Elemental Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Lightning Damage'),
    replaces: 'incr_ele_dmg',
    stats: [
      { ref: stat('#% increased Lightning Damage'), required: true },
      { ref: stat('#% increased Elemental Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Cold Damage'),
    replaces: 'incr_ele_dmg',
    stats: [
      { ref: stat('#% increased Cold Damage'), required: true },
      { ref: stat('#% increased Elemental Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Fire Damage'),
    group: 'incr_fire_dmg',
    replaces: 'incr_ele_dmg',
    stats: [
      { ref: stat('#% increased Fire Damage'), required: true },
      { ref: stat('#% increased Elemental Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Spell Damage'),
    group: 'incr_spell_dmg',
    stats: [
      { ref: stat('#% increased Spell Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Lightning Spell Damage'),
    replaces: 'incr_spell_dmg',
    stats: [
      { ref: stat('#% increased Lightning Spell Damage'), required: true },
      { ref: stat('#% increased Spell Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Cold Spell Damage'),
    replaces: 'incr_spell_dmg',
    stats: [
      { ref: stat('#% increased Cold Spell Damage'), required: true },
      { ref: stat('#% increased Spell Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Fire Spell Damage'),
    replaces: 'incr_spell_dmg',
    stats: [
      { ref: stat('#% increased Fire Spell Damage'), required: true },
      { ref: stat('#% increased Spell Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Elemental Damage with Attack Skills'),
    replaces: 'incr_ele_dmg',
    stats: [
      { ref: stat('#% increased Elemental Damage with Attack Skills'), required: true },
      { ref: stat('#% increased Elemental Damage') }
    ]
  },
  {
    pseudo: stat('#% increased Burning Damage'),
    replaces: 'incr_fire_dmg',
    stats: [
      { ref: stat('#% increased Burning Damage'), required: true },
      { ref: stat('#% increased Fire Damage') },
      { ref: stat('#% increased Elemental Damage') }
    ]
  },
  {
    pseudo: stat('# Life Regenerated per Second'),
    stats: [
      { ref: stat('Regenerate # Life per second') }
    ]
  },
  {
    pseudo: stat('#% of Life Regenerated per Second'),
    stats: [
      { ref: stat('Regenerate #% of Life per second') }
    ]
  },
  {
    pseudo: stat('#% of Physical Attack Damage Leeched as Life'),
    stats: [
      { ref: stat('#% of Physical Attack Damage Leeched as Life') }
    ]
  },
  {
    pseudo: stat('#% of Physical Attack Damage Leeched as Mana'),
    stats: [
      { ref: stat('#% of Physical Attack Damage Leeched as Mana') }
    ]
  },
  {
    pseudo: stat('#% increased Mana Regeneration Rate'),
    stats: [
      { ref: stat('#% increased Mana Regeneration Rate') }
    ]
  }
]

export function filterPseudo (ctx: FiltersCreationContext) {
  const filterByGroup = new Map<string, StatFilter[]>()

  rulesLoop:
  for (const rule of PSEUDO_RULES) {
    const sources = filterPseudoSources(ctx.statsByType, ({ stat }, source) => {
      const info = rule.stats.find(info => info.ref === stat.ref)
      if (!info) return null

      const multi = info.multiplier ?? 1
      return {
        ...source,
        contributes: {
          value: source.contributes!.value * multi,
          min: source.contributes!.min * multi,
          max: source.contributes!.max * multi
        }
      }
    })
    if (!sources.length) continue

    if (rule.stats.some(s => s.required)) {
      for (const stat of rule.stats) {
        if (stat.required && !sources.some(source =>
          source.stat.stat.ref === stat.ref)) {
          continue rulesLoop
        }
      }
    }

    const filter = calculatedStatToFilter({
      stat: STAT_BY_REF(rule.pseudo)!,
      type: ModifierType.Pseudo,
      sources: sources
    }, ctx.searchInRange, ctx.item)

    filter.disabled = rule.disabled ?? true

    if (rule.mutate) {
      rule.mutate(filter)
    }

    ctx.filters.push(filter)

    if (rule.replaces && filterByGroup.has(rule.replaces)) {
      const replacedFilters = filterByGroup.get(rule.replaces)!
      ctx.filters = ctx.filters.filter(filter => !replacedFilters.includes(filter))
    }

    if (rule.group) {
      if (filterByGroup.has(rule.group)) {
        filterByGroup.get(rule.group)!.push(filter)
      } else {
        filterByGroup.set(rule.group, [filter])
      }
    }
  }

  ctx.statsByType = ctx.statsByType.filter(m =>
    !PSEUDO_RULES.some(rule => rule.stats.some(({ ref }) => m.stat.ref === ref)))

  if (filterByGroup.has('to_x_ele_res')) {
    const resFilters = filterByGroup.get('to_x_ele_res')!

    resFilters.sort((a, b) => b.roll!.value - a.roll!.value)
    const maxFilter = (resFilters[0]?.roll?.value === resFilters[1]?.roll?.value)
      ? undefined
      : resFilters[0]

    if (maxFilter) {
      maxFilter.hidden = 'filters.hide_ele_res'
    }

    ctx.filters = ctx.filters.filter(filter => !resFilters.includes(filter) || filter === maxFilter)
  }

  if (filterByGroup.has('to_x_attr')) {
    const attrFilters = filterByGroup.get('to_x_attr')!
    attrFilters.sort((a, b) => b.roll!.value - a.roll!.value)
    if (attrFilters.length === 3) {
      const toAll = filterByGroup.get('to_all_attrs')
      if (attrFilters.every(f => f.roll!.value === attrFilters[0].roll!.value) && toAll != null) {
        ctx.filters = ctx.filters.filter(filter => !attrFilters.includes(filter))
      } else {
        if (toAll != null) {
          ctx.filters = ctx.filters.filter(filter => !toAll.includes(filter))
        }

        if (attrFilters[2].roll!.value / attrFilters[0].roll!.value < 0.3) {
          if (attrFilters[1].roll!.value === attrFilters[2].roll!.value) {
            attrFilters[1].hidden = 'hide_attr_same_2nd_n_3rd'
            attrFilters[2].hidden = 'hide_attr_same_2nd_n_3rd'
          } else {
            attrFilters[2].hidden = 'hide_attr_smallest_total'
          }
        }
      }
    }
  }
}

function filterPseudoSources (
  stats: StatCalculated[],
  mapFn: (calc: StatCalculated, source: StatSource) => StatSource | null
): StatSource[] {
  const out: StatSource[] = []
  for (const calc of stats) {
    for (const source of calc.sources) {
      const result = mapFn(calc, source)
      if (result) {
        out.push(result)
      }
    }
  }
  return out
}
