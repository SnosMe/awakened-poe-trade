// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TooltipItem from '@/web/price-check/trade/TooltipItem.vue'
import type { PricingResult } from '@/web/price-check/trade/pathofexile-trade'
import { TradeNumberColors, type DisplayInfluence, type DisplayItemLine } from '@/web/price-check/trade/trade-tooltip'

const ALL_INFLUENCES: DisplayInfluence[] = [
  'shaper',
  'elder',
  'crusader',
  'hunter',
  'redeemer',
  'warlord',
  'searing-exarch',
  'eater-of-worlds'
]

function mountTooltip (influences: DisplayInfluence[], implicitMods?: DisplayItemLine[]) {
  const result = {
    displayItem: {
      title: ['Fixture Mantle', 'Vaal Regalia'],
      rarity: 'Rare',
      frameType: 2,
      influences,
      implicitMods
    }
  } as unknown as PricingResult

  return mount(TooltipItem, {
    props: { result },
    global: {
      stubs: { UiDetailedItemImg: true }
    }
  })
}

describe('Trade listing tooltip influences', () => {
  it('renders every classic and Eldritch influence returned by the normalizer', () => {
    const wrapper = mountTooltip(ALL_INFLUENCES)
    const badges = wrapper.findAll('[data-influence]')

    expect(badges.map(badge => badge.attributes('data-influence'))).toEqual(ALL_INFLUENCES)
    expect(badges.map(badge => badge.text())).toEqual([
      'Shaper',
      'Elder',
      'Crusader',
      'Hunter',
      'Redeemer',
      'Warlord',
      'Searing Exarch',
      'Eater of Worlds'
    ])

    expect(wrapper.findAll('[data-influence] img')).toHaveLength(6)
    expect(wrapper.find('[data-influence="shaper"] img').attributes('src')).toBe('/images/influence-Shaper.png')
    expect(wrapper.find('[data-influence="searing-exarch"] img').exists()).toBe(false)
    expect(wrapper.find('[data-influence="eater-of-worlds"] img').exists()).toBe(false)
  })

  it('omits the influence row when the API reports none', () => {
    expect(mountTooltip([]).find('[data-testid="item-influences"]').exists()).toBe(false)
  })

  it('colors only associated Eldritch implicit lines and renders their tiers', () => {
    const wrapper = mountTooltip(
      ['searing-exarch', 'eater-of-worlds'],
      [
        {
          text: '+12% to all Elemental Resistances',
          color: TradeNumberColors.Augmented
        },
        {
          text: '5% Chance to Block Spell Damage',
          tier: 'Lesser',
          color: TradeNumberColors.Augmented,
          influence: 'eater-of-worlds'
        },
        {
          text: '17% increased Global Physical Damage',
          tier: 'Lesser',
          color: TradeNumberColors.Augmented,
          influence: 'searing-exarch'
        }
      ]
    )

    const ordinary = wrapper.findAll('[data-testid="modifier-line"]')
      .find(line => line.text() === '+12% to all Elemental Resistances')!
    const eater = wrapper.find('[data-mod-influence="eater-of-worlds"]')
    const exarch = wrapper.find('[data-mod-influence="searing-exarch"]')

    expect(ordinary.text()).toBe('+12% to all Elemental Resistances')
    expect(ordinary.html()).not.toContain('influence-eater-of-worlds')
    expect(ordinary.html()).not.toContain('influence-searing-exarch')
    expect(eater.text()).toContain('Lesser')
    expect(eater.html()).toContain('influence-eater-of-worlds')
    expect(exarch.text()).toContain('Lesser')
    expect(exarch.html()).toContain('influence-searing-exarch')
  })
})
