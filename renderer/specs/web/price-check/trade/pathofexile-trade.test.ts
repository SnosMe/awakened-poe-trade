import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import fixture from '../../../fixtures/trade-fetch-poe1.json'
import { findPropertyValue, testExports, DisplayItemLine } from '@/web/price-check/trade/trade-tooltip'

function parse (item = fixture.item) {
  return testExports.parseFetchResult({
    ...fixture,
    item
  } as unknown as Parameters<typeof testExports.parseFetchResult>[0])
}

function tiers (lines: DisplayItemLine[] | undefined) {
  return lines?.map(line => line.tier)
}

function expectTooltipColorCss (color: number, tailwindClass: string) {
  const tooltip = fs.readFileSync(path.resolve(__dirname, '../../../../src/web/price-check/trade/TooltipItem.vue'), 'utf8')
  expect(tooltip).toContain(`.number-color-${color} {`)
  expect(tooltip).toContain(`@apply ${tailwindClass};`)
}

describe('PoE 1 trade listing tooltip parsing', () => {
  it('retains the fetched item title, icon, properties, requirements, sockets, and tags', () => {
    const item = parse()

    expect(item).toMatchObject({
      title: ['Kraken Guardian', 'Vaal Regalia'],
      rarity: 'Rare',
      frameType: 2,
      icon: {
        url: expect.stringContaining('VaalRegalia.png'),
        w: 2,
        h: 3
      },
      sockets: fixture.item.sockets
    })
    expect(item?.nameBlock).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: 'Quality: ', value: '+20%' }),
      expect.objectContaining({ text: 'Energy Shield: ', value: '437' })
    ]))
    expect(item?.itemProps).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: 'Item Level: ', value: 84 }),
      expect.objectContaining({ text: 'Requires Level ', value: '68, 194 Int' })
    ]))
    expect(item?.itemTags).toContainEqual(expect.objectContaining({ text: 'Corrupted' }))
  })

  it('normalizes every classic and Eldritch influence field from the PoE 1 fetch payload', () => {
    const item = parse({
      ...fixture.item,
      influences: {
        shaper: true,
        elder: true,
        crusader: true,
        hunter: true,
        redeemer: true,
        warlord: true,
        ignored_future_field: true,
        ignored_false_field: false
      },
      searing: true,
      tangled: true
    })

    expect(item.influences).toEqual([
      'shaper',
      'elder',
      'crusader',
      'hunter',
      'redeemer',
      'warlord',
      'searing-exarch',
      'eater-of-worlds'
    ])
  })

  it('identifies only Eldritch implicit lines and derives unambiguous Lesser tiers', () => {
    const item = parse({
      ...fixture.item,
      searing: true,
      tangled: true,
      enchantMods: [{
        description: 'Allocates Whispers of Doom',
        hash: 'stat.implicit.stat_561307714',
        mods: [{ level: 75, magnitudes: [{ min: '5', max: '5' }] }]
      }],
      implicitMods: [
        '+12% to all Elemental Resistances',
        {
          description: '5% Chance to Block Spell Damage',
          hash: 'stat.implicit.stat_561307714',
          mods: [{ level: 75, magnitudes: [{ min: '5', max: '5' }] }]
        },
        {
          description: '17% increased Global Physical Damage',
          hash: 'stat.implicit.stat_1310194496',
          mods: [{ level: 75, magnitudes: [{ min: '15', max: '17' }] }]
        }
      ],
      extended: undefined
    } as never)

    expect(item.enchantMods?.[0].influence).toBeUndefined()
    expect(item.implicitMods).toEqual([
      expect.objectContaining({ text: '+12% to all Elemental Resistances' }),
      expect.objectContaining({
        text: '5% Chance to Block Spell Damage',
        influence: 'eater-of-worlds',
        tier: 'Lesser'
      }),
      expect.objectContaining({
        text: '17% increased Global Physical Damage',
        influence: 'searing-exarch',
        tier: 'Lesser'
      })
    ])
    expect(item.implicitMods?.[0].influence).toBeUndefined()
  })

  it('omits an Eldritch tier when the API magnitude matches multiple ranks', () => {
    const item = parse({
      ...fixture.item,
      searing: true,
      tangled: false,
      implicitMods: [{
        description: '+1% to maximum Lightning Resistance',
        hash: 'stat.implicit.stat_1011760251',
        mods: [{ level: 75, magnitudes: [{ min: '1', max: '1' }] }]
      }],
      extended: undefined
    } as never)

    expect(item.implicitMods?.[0]).toMatchObject({
      influence: 'searing-exarch',
      tier: undefined
    })
  })

  it('preserves modifier categories, tiers, and colors from current rich fetch lines', () => {
    const item = parse()

    expect(item?.implicitMods).toContainEqual(expect.objectContaining({
      text: '+12% to all Elemental Resistances',
      color: 1
    }))
    expect(item?.explicitMods).toEqual([
      expect.objectContaining({ text: '+97 to maximum Energy Shield', tier: 'P1', color: 1 }),
      expect.objectContaining({ text: '+44% to Fire Resistance', tier: 'S2', color: 1 }),
      expect.objectContaining({ text: '63% increased Energy Shield', tier: 'R3', color: 8734 })
    ])
  })

  it('maps legacy string display lines through hashes instead of metadata order', () => {
    const item = parse({
      ...fixture.item,
      explicitMods: [
        '10% increased Armour',
        '+20 to maximum Life',
        '+20 to Strength'
      ],
      extended: {
        hashes: {
          explicit: [
            ['explicit.stat_armour', [1]],
            ['explicit.stat_life', [1]],
            ['explicit.stat_strength', [0, 2]]
          ]
        },
        mods: {
          explicit: [
            { name: 'of Strength', tier: 'S5', level: 10, magnitudes: [] },
            { name: 'Hybrid Armour and Life', tier: 'P7', level: 20, magnitudes: [] },
            { name: 'Hybrid Strength', tier: 'P9', level: 30, magnitudes: [] }
          ]
        }
      }
    })

    expect(tiers(item?.explicitMods)).toEqual(['P7', 'P7', 'S5 + P9'])
  })

  it('keeps PoE 1 modifier categories visually distinct', () => {
    const item = parse({
      ...fixture.item,
      enchantMods: ['Allocates Whispers of Doom'],
      implicitMods: ['+12% to all Elemental Resistances'],
      fracturedMods: ['+45% to Fire Resistance'],
      explicitMods: [
        {
          description: '+50 to maximum Life',
          flags: { fractured: true },
          hash: 'stat.fractured.stat_life',
          mods: [{ name: 'Fractured', tier: 'P2', magnitudes: [] }]
        }
      ],
      craftedMods: ['20% increased Energy Shield'],
      extended: undefined
    })

    expect(item?.enchantMods?.[0].color).toBe(8729)
    expect(item?.implicitMods?.[0].color).toBe(1)
    expect(item?.fracturedMods?.[0].color).toBe(8730)
    expect(item?.explicitMods?.[0]).toMatchObject({ color: 8730, tier: 'P2' })
    expect(item?.craftedMods?.[0].color).toBe(8734)
  })

  it('orders embedded rich modifier categories within each affix side', () => {
    const item = parse({
      ...fixture.item,
      fracturedMods: undefined,
      craftedMods: undefined,
      explicitMods: [
        { description: 'Crafted Prefix', flags: { crafted: true }, mods: [{ tier: 'P3', magnitudes: [] }] },
        { description: 'Explicit Suffix', mods: [{ tier: 'S2', magnitudes: [] }] },
        { description: 'Fractured Prefix', flags: { fractured: true }, mods: [{ tier: 'P1', magnitudes: [] }] },
        { description: 'Explicit Prefix', mods: [{ tier: 'P2', magnitudes: [] }] },
        { description: 'Crafted Suffix', flags: { crafted: true }, mods: [{ tier: 'S3', magnitudes: [] }] },
        { description: 'Fractured Suffix', flags: { fractured: true }, mods: [{ tier: 'S1', magnitudes: [] }] }
      ],
      extended: undefined
    })

    const ordered = testExports.orderDisplayAffixes([
      item.fracturedMods,
      item.explicitMods,
      item.craftedMods,
      item.veiledMods
    ])
    expect(ordered.map(line => line.text)).toEqual([
      'Fractured Prefix',
      'Explicit Prefix',
      'Crafted Prefix',
      'Fractured Suffix',
      'Explicit Suffix',
      'Crafted Suffix'
    ])
  })

  it('tolerates malformed properties and recognizes localized level requirements by type', () => {
    const malformed = {
      ...fixture.item,
      properties: [{ name: '', displayMode: 0, type: 6 }],
      requirements: [
        { name: 'Niveau', values: [['68', 0]], displayMode: 0, type: 62 },
        { name: 'Intelligence', values: [['194', 0]], displayMode: 0, type: 63 }
      ]
    }

    expect(findPropertyValue(malformed as never, 6)).toBeUndefined()
    expect(() => parse(malformed as never)).not.toThrow()
    expect(parse(malformed as never).itemProps).toContainEqual(
      expect.objectContaining({ text: 'Requires Niveau ', value: '68, 194 Intelligence' })
    )
  })

  it('preserves an unrecognized localized veiled label instead of guessing its side', () => {
    const item = parse({
      ...fixture.item,
      veiledMods: ['Préfixe voilé'],
      extended: undefined
    })
    expect(item.veiledMods?.[0].text).toBe('Préfixe voilé')
  })

  it('handles missing optional blocks', () => {
    expect(() => parse({
      ...fixture.item,
      properties: undefined,
      requirements: undefined,
      implicitMods: undefined,
      explicitMods: undefined,
      extended: undefined,
      sockets: undefined
    })).not.toThrow()
  })

  it('retains unsupported frame types for a neutral renderer fallback', () => {
    expect(parse({ ...fixture.item, rarity: 'Currency', frameType: 5 })).toMatchObject({
      rarity: 'Currency',
      frameType: 5
    })
  })

  it('keeps CSS classes for special modifier colors', () => {
    expectTooltipColorCss(8729, 'text-indigo-300')
    expectTooltipColorCss(8730, 'text-orange-300')
    expectTooltipColorCss(8734, 'text-blue-400')
  })
})
