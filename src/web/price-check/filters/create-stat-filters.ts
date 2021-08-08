import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'
import { ItemModifier, ModifierType } from '@/parser/modifiers'
import { uniqueModFilterPartial } from './unique-roll'
import { rollToFilter, percentRoll } from './util'
import { ItemHasEmptyModifier, StatFilter } from './interfaces'
import { filterPseudo } from './pseudo'
import { filterItemProp } from './pseudo/item-property'
import { filterUniqueItemProp } from './pseudo/item-property-unique'
import { ARMOUR, WEAPON } from '@/parser/meta'

export interface FiltersCreationContext {
  readonly item: ParsedItem
  filters: Array<Writeable<StatFilter>>
  modifiers: ParsedItem['modifiers']
}

export function initUiModFilters (item: ParsedItem): StatFilter[] {
  if (
    (item.rarity === ItemRarity.Unique && item.category === ItemCategory.Map) ||
    item.category === ItemCategory.MavenInvitation
  ) {
    return []
  }

  const ctx: FiltersCreationContext = {
    item,
    filters: [],
    modifiers: item.modifiers.map(mod => {
      if (mod.type === ModifierType.Fractured && mod.trade.ids[ModifierType.Explicit]) {
        return { ...mod, type: ModifierType.Explicit }
      } else {
        return mod
      }
    })
  }

  if (!item.isUnidentified) {
    if (item.rarity === ItemRarity.Unique) {
      filterUniqueItemProp(ctx)
    } else {
      filterItemProp(ctx)
      filterPseudo(ctx)
    }
  }

  if (!item.isCorrupted && !item.isMirrored) {
    ctx.modifiers = ctx.modifiers.filter(mod => mod.type !== ModifierType.Fractured)
    ctx.modifiers.push(...item.modifiers.filter(mod => mod.type === ModifierType.Fractured))
  }

  ctx.filters.push(
    ...ctx.modifiers.map(mod => itemModToFilter(mod, item))
  )

  if (!item.isCorrupted && !item.isMirrored && item.isSynthesised) {
    const transformedImplicits = item.modifiers.filter(mod =>
      mod.type === ModifierType.Implicit &&
      !ctx.modifiers.includes(mod))

    const synthImplicitFilters = transformedImplicits.map(mod => itemModToFilter(mod, item))
    for (const filter of synthImplicitFilters) {
      filter.hidden = 'Select only if price-checking as base item for crafting'
    }
    ctx.filters.push(...synthImplicitFilters)
  }

  if (item.isUnidentified && item.rarity === ItemRarity.Unique) {
    ctx.filters = ctx.filters.filter(f => !f.hidden)
  }

  if (item.extra.veiled) {
    ctx.filters.forEach(filter => { filter.disabled = true })
  }

  if (item.category === ItemCategory.Map) {
    ctx.filters = ctx.filters.filter(f => f.type !== 'explicit')
  }

  finalFilterTweaks(ctx)

  return ctx.filters
}

export function itemModToFilter (mod: ItemModifier, item: ParsedItem) {
  const filter: Writeable<StatFilter> = {
    tradeId: mod.trade.ids[mod.type],
    statRef: mod.stat.ref,
    text: mod.string,
    type: mod.type,
    option: mod.trade.option,
    corrupted: mod.corrupted,
    roll: undefined,
    disabled: true,
    min: undefined,
    max: undefined
  }
  if (mod.trade.option) {
    filter.roll = mod.value!
    return filter
  }

  if (
    item.rarity === ItemRarity.Unique &&
    mod.type !== ModifierType.Enchant
  ) {
    uniqueModFilterPartial(item, mod, filter)
  } else {
    itemModFilterPartial(mod, filter)
  }

  filterAdjustmentForNegate(mod, filter)

  return filter
}

function itemModFilterPartial (
  mod: ItemModifier,
  filter: Writeable<StatFilter>
) {
  if (mod.value) {
    if (mod.type === 'enchant') {
      filter.roll = percentRoll(mod.value, 0, Math.floor, mod.stat.dp)
      filter.min = filter.roll
      filter.max = filter.roll
      filter.defaultMin = filter.roll
      filter.defaultMax = filter.roll
    } else {
      Object.assign(filter, rollToFilter(mod.value, { dp: mod.stat.dp }))
    }
  }
}

function filterAdjustmentForNegate (
  mod: ItemModifier,
  filter: Writeable<StatFilter>
) {
  if (mod.negate) {
    filter.invert = true
    const raw = { ...filter }

    if (filter.boundMin != null && filter.boundMax != null) {
      filter.boundMin = -1 * raw.boundMax!
      filter.boundMax = -1 * raw.boundMin!
    }
    if (filter.defaultMin != null && filter.defaultMax != null) {
      filter.defaultMin = -1 * raw.defaultMax!
      filter.defaultMax = -1 * raw.defaultMin!
    }
    if (filter.min == null && filter.max == null && filter.defaultMax != null) {
      filter.min = -1 * (raw.defaultMax as number)
    } else {
      if (filter.max != null) {
        filter.min = -1 * (raw.max as number)
      }
      if (filter.min != null) {
        filter.max = -1 * (raw.min as number)
      }
    }
    if (filter.roll != null) {
      filter.roll = -1 * raw.roll!
    }
  } else {
    if (filter.min == null && filter.max == null && filter.defaultMin != null) {
      filter.min = filter.defaultMin
    }
  }

  if (mod.trade.inverted) {
    filter.invert = !filter.invert
  }
}

function finalFilterTweaks (ctx: FiltersCreationContext) {
  const { item } = ctx

  if (item.category === ItemCategory.ClusterJewel && item.rarity !== ItemRarity.Unique) {
    for (const filter of ctx.filters) {
      if (filter.type === 'enchant') {
        if (filter.statRef === '# Added Passive Skills are Jewel Sockets') {
          filter.hidden = 'Roll is not variable'
        }
        if (filter.statRef === 'Added Small Passive Skills grant: #') {
          filter.disabled = false
        }
        if (filter.statRef === 'Adds # Passive Skills') {
          // https://pathofexile.gamepedia.com/Cluster_Jewel#Optimal_passive_skill_amounts
          filter.disabled = false
          filter.min = undefined
          if (filter.max === 4) {
            filter.max = 5
          }
        }
      }
    }
  }

  if (item.category === ItemCategory.Map) {
    const isInfluenced = ctx.filters.find(filter => filter.statRef === 'Area is influenced by #')
    const isElderGuardian = ctx.filters.find(filter => filter.statRef === 'Map is occupied by #')
    if (isInfluenced && !isElderGuardian && isInfluenced.roll === 2 /* TODO: hardcoded */) {
      const idx = ctx.filters.indexOf(isInfluenced)
      ctx.filters.splice(idx + 1, 0, {
        tradeId: ['map.no_elder_guardian'],
        text: 'Map is not occupied by Elder Guardian',
        statRef: 'Map is not occupied by Elder Guardian',
        disabled: false,
        type: 'implicit',
        min: undefined,
        max: undefined
      })
    }
    if (isInfluenced) {
      isInfluenced.disabled = false
    }
    if (isElderGuardian) {
      isElderGuardian.disabled = false
    }
  }

  if (showHasEmptyModifier(ctx)) {
    ctx.filters.push({
      tradeId: ['item.has_empty_modifier'],
      text: '1 Empty or Crafted Modifier',
      statRef: '1 Empty or Crafted Modifier',
      disabled: true,
      hidden: 'Select only if item has 6 modifiers (1 of which is crafted) or if it has 5 modifiers',
      type: 'pseudo',
      roll: ItemHasEmptyModifier.Any,
      option: 'num',
      min: undefined,
      max: undefined
    })
  }

  if (item.category === ItemCategory.Amulet) {
    const anointment = ctx.filters.find(filter => filter.statRef === 'Allocates #')
    if (anointment) {
      if (item.props.talismanTier) {
        anointment.disabled = false
      } else if (!item.isCorrupted && !item.isMirrored) {
        anointment.hidden = 'Buyer will likely change anointment'
      }
    }
  }

  for (const filter of ctx.filters) {
    if (filter.type === ModifierType.Fractured) {
      const mod = ctx.item.modifiers.find(mod => mod.stat.ref === filter.statRef)!
      if (mod.trade.ids[ModifierType.Explicit]) {
        // hide only if fractured mod has corresponding explicit variant
        filter.hidden = 'Select only if price-checking as base item for crafting'
      }
    }
  }
}

function showHasEmptyModifier (ctx: FiltersCreationContext): boolean {
  const { item } = ctx

  if (
    item.rarity !== ItemRarity.Rare ||
    !item.category ||
    item.isCorrupted ||
    item.isMirrored
  ) return false

  let totalUsed: number = item.modifiers.filter(mod =>
    mod.type === ModifierType.Explicit ||
    mod.type === ModifierType.Fractured ||
    mod.type === ModifierType.Crafted).length

  let hasCrafted = item.modifiers.some(mod => mod.type === ModifierType.Crafted)

  if (item.extra.veiled) {
    totalUsed += (item.extra.veiled === 'prefix-suffix' ? 2 : 1)
    hasCrafted = true
  }

  if (
    (totalUsed === 5 && !hasCrafted) ||
    (totalUsed >= 6 /* && hasCrafted */) // don't force player to craft mod (proving that item has empty slot)
  ) {
    return (
      ARMOUR.has(item.category) ||
      WEAPON.has(item.category) ||
      item.category === ItemCategory.Amulet ||
      item.category === ItemCategory.Belt ||
      item.category === ItemCategory.Ring ||
      item.category === ItemCategory.Quiver
    )
  }

  return false
}
