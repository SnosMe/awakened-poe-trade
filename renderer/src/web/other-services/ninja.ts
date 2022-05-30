import { ItemCategory, ItemRarity, parseClipboard } from '@/parser'
import { ParserState } from '@/parser/Parser'
import { ACCESSORY, ARMOUR, WEAPON } from '@/parser/meta'
import { ModifierType } from '@/parser/modifiers'

function createRequestParams (item: ParserState) {
  if (item.rarity === ItemRarity.Unique && item.category) {
    if (WEAPON.has(item.category)) {
      return { category: 'unique-weapons' }
    }

    if (ARMOUR.has(item.category)) {
      return { category: 'unique-armours' }
    }

    if (ACCESSORY.has(item.category)) {
      return { category: 'unique-accessories' }
    }

    if (item.category === ItemCategory.Flask) {
      return { category: 'unique-armours' }
    }

    if (item.category === ItemCategory.Jewel || item.category === ItemCategory.ClusterJewel) {
      return { category: 'unique-jewels' }
    }

    if (item.category === ItemCategory.Map) {
      return { category: 'unique-maps' }
    }
  }

  if (item.category === ItemCategory.ClusterJewel) {
    const granted = item.statsByType.find(({ stat }) => stat.ref.includes('grant:'))
    if (!granted) return

    const values = granted.sources[0].stat.translation.string
      .split(/\n/)
      .map(l => l.split(':')[1])
      .map(l => Array.from(l).filter(c => !c.match('\\d|%')).join('').trim())
    if (!values) return

    return {
      category: 'cluster-jewels',
      value: values[0]
    }
  }

  if (item.category === ItemCategory.Helmet) {
    const enchants = item.statsByType.filter(({ type }) => type === ModifierType.Enchant)
    if (!enchants) return

    return {
      category: 'helmet-enchants',
      value: encodeURIComponent(enchants[0].stat.ref.replace('#', ''))
    }
  }

  if (item.category === ItemCategory.Gem) {
    return { category: 'skill-gems' }
  }

  if (item.category === ItemCategory.CapturedBeast) {
    return { category: 'beasts' }
  }

  if (item.category === ItemCategory.Currency) {
    if (item.info.refName === 'Astragali' ||
      item.info.refName === 'Burial Medallion' ||
      item.info.refName === 'Exotic Coinage' ||
      item.info.refName === 'Scrap Metal'
    ) {
      return { category: 'artifacts' }
    }

    if (item.info.refName.includes('Delirium')) {
      return { category: 'delirium-orbs' }
    }

    if (item.info.refName.includes('Fossil')) {
      return { category: 'fossils' }
    }

    if (item.info.refName.includes('Resonator')) {
      return { category: 'resonators' }
    }

    if (item.info.refName.includes('Essence')) {
      return { category: 'essences' }
    }

    if (item.info.refName.includes('Oil')) {
      return { category: 'oils' }
    }

    if (item.info.refName.includes('Incubator')) {
      return { category: 'incubators' }
    }

    if (item.info.refName.includes('Vial')) {
      return { category: 'vials' }
    }

    return { category: 'currency' }
  }

  if (item.category === ItemCategory.Fragment) {
    if (item.info.refName.includes('Scarab')) {
      return { category: 'scarabs' }
    }

    return { category: 'fragments' }
  }

  if (item.category === ItemCategory.DivinationCard) {
    return { category: 'divination-cards' }
  }

  if (item.category === ItemCategory.Invitation) {
    return { category: 'invitations' }
  }

  if (item.category === ItemCategory.Map) {
    if (item.mapBlighted === 'Blighted') {
      return { category: 'blighted-maps' }
    }

    if (item.mapBlighted === 'Blight-ravaged') {
      return { category: 'blight-ravaged-maps' }
    }

    return { category: 'maps' }
  }

  return null
}

export function openNinja (clipboard: string) {
  const item = parseClipboard(clipboard)
  if (!item) return

  const params = createRequestParams(item)
  if (!params) return

  window.open(`https://poe.ninja/challenge/${params.category}?name=${params.value || item.info.refName}`)
}
