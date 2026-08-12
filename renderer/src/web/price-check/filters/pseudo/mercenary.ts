import { ItemCategory, ParsedItem } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import { findAndResolveByRef } from './utils'
import { FilterTag, FilterOrGroup, MercenaryFilterGroup, StatFilter } from '../interfaces'

export function createMercenaryFilters (item: ParsedItem): FilterOrGroup[] {
  const out: FilterOrGroup[] = []

  for (const group of item.mercenarySkills!) {
    const [skill, ...supports] = group

    const skillFilter: StatFilter = {
      tradeId: skill.stat.trade.ids[ModifierType.Pseudo],
      statRef: skill.stat.ref,
      text: skill.translation.string,
      tag: FilterTag.Pseudo,
      sources: [],
      disabled: true
    }

    if (!supports.length) {
      out.push(skillFilter)
      continue
    }

    const filterGroup: MercenaryFilterGroup = {
      group: 'mercenary',
      expanded: false,
      skill: skillFilter,
      supports: []
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

      filterGroup.supports.push({
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

  return out
}
