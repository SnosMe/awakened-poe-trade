import { ParsedItem, ItemCategory } from '@/parser'
import { WEAPON } from '@/parser/meta'

export const VEILED_STAT: Array<{
  test: (item: ParsedItem) => boolean
  name: string
  stat: string
}> = [
  {
    test: (item) => item.extra.veiled === 'prefix-suffix',
    name: 'Veiled',
    stat: 'Veiled<<and>>of the Veil'
  },
  {
    test: (item) => item.extra.veiled === 'prefix',
    name: 'Veiled',
    stat: 'Veiled'
  },
  {
    test: (item) => item.extra.veiled === 'suffix',
    name: 'Veiled',
    stat: 'of the Veil'
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (item.category === ItemCategory.Ring || item.category === ItemCategory.Belt),
    name: 'Syndicate: Leo',
    stat: "Leo's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (WEAPON.has(item.category!) || item.category === ItemCategory.Shield),
    name: 'Mastermind: Catarina',
    stat: "Catarina's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (item.category === ItemCategory.Ring || item.category === ItemCategory.Amulet),
    name: 'Syndicate: Elreon',
    stat: "Elreon's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (item.category === ItemCategory.Gloves || item.category === ItemCategory.Amulet),
    name: 'Syndicate: Vorici',
    stat: "Vorici's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (WEAPON.has(item.category!) || item.category === ItemCategory.Shield),
    name: 'Syndicate: Haku',
    stat: "Haku's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      WEAPON.has(item.category!),
    name: 'Syndicate: Tora',
    stat: "Tora's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (WEAPON.has(item.category!) && item.category !== ItemCategory.Bow && item.category !== ItemCategory.Wand),
    name: 'Syndicate: Vagan',
    stat: "Vagan's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      item.category === ItemCategory.Gloves,
    name: 'Syndicate: Guff',
    stat: "Guff's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      (WEAPON.has(item.category!) || item.category === ItemCategory.Shield),
    name: 'Syndicate: It That Fled',
    stat: "It That Fled's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      item.category === ItemCategory.BodyArmour,
    name: 'Syndicate: Gravicius',
    stat: "Gravicius' Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      item.category === ItemCategory.Helmet,
    name: 'Syndicate: Korell',
    stat: "Korell's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'prefix' &&
      item.category === ItemCategory.Boots,
    name: 'Syndicate: Rin',
    stat: "Rin's Veiled"
  },
  {
    test: (item) => item.extra.veiled === 'suffix' &&
      item.category === ItemCategory.Helmet,
    name: 'Syndicate: Janus',
    stat: "of Janus' Veil"
  },
  {
    test: (item) => item.extra.veiled === 'suffix' &&
      item.category === ItemCategory.BodyArmour,
    name: 'Syndicate: Hillock',
    stat: "of Hillock's Veil"
  },
  {
    test: (item) => item.extra.veiled === 'suffix' &&
      item.category === ItemCategory.Amulet,
    name: 'Syndicate: Jorgin',
    stat: "of Jorgin's Veil"
  },
  {
    test: (item) => item.extra.veiled === 'suffix' &&
      item.category === ItemCategory.Ring,
    name: 'Syndicate: Cameria',
    stat: "of Cameria's Veil"
  },
  {
    test: (item) => item.extra.veiled === 'suffix' &&
      item.category === ItemCategory.Ring,
    name: 'Syndicate: Aisling',
    stat: "of Aisling's Veil"
  },
  {
    test: (item) => item.extra.veiled === 'suffix' &&
      item.category === ItemCategory.Ring,
    name: 'Syndicate: Riker',
    stat: "of Riker's Veil"
  }
]
