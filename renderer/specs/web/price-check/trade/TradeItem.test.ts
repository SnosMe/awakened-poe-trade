// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import TradeItem from '@/web/price-check/trade/TradeItem.vue'

const mocks = vi.hoisted(() => ({
  config: { itemHoverTooltip: 'off' as 'off' | 'keybind' | 'always' },
  reactiveConfig: null as null | { itemHoverTooltip: 'off' | 'keybind' | 'always' },
  tippy: vi.fn(),
  instances: [] as Array<{
    state: { isVisible: boolean }
    enable: ReturnType<typeof vi.fn>
    disable: ReturnType<typeof vi.fn>
    show: ReturnType<typeof vi.fn>
    hide: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
  }>
}))

vi.mock('@/web/Config', async () => {
  const { reactive } = await import('vue')
  const config = reactive(mocks.config)
  mocks.reactiveConfig = config
  return { AppConfig: () => config }
})

vi.mock('@/web/i18n', () => ({
  useI18nNs: () => ({ t: (key: string) => key })
}))

vi.mock('tippy.js', () => ({
  default: mocks.tippy
}))

const result = {
  id: 'listing-1',
  relativeDate: 'now',
  priceAmount: 1,
  priceCurrency: 'divine',
  hasNote: true,
  hasFee: true,
  isMine: false,
  accountName: 'seller',
  accountStatus: 'online' as const,
  ign: 'Seller',
  listedTimes: 1,
  displayItem: {
    rarity: 'Rare',
    frameType: 2,
    name: 'Fixture Mantle',
    baseType: 'Vaal Regalia',
    properties: [],
    requirements: [],
    itemTags: [],
    itemLevel: { text: 'Item Level: ', value: '86' }
  }
}

function makeInstance () {
  const state = { isVisible: false }
  const instance = {
    state,
    enable: vi.fn(),
    disable: vi.fn(),
    show: vi.fn(() => { state.isVisible = true }),
    hide: vi.fn(() => { state.isVisible = false }),
    destroy: vi.fn()
  }
  mocks.instances.push(instance)
  return instance
}

function mountRow () {
  return mount(TradeItem, {
    props: {
      result,
      showStock: false,
      showItemLevel: false,
      showGemLevel: false,
      showQuality: false,
      showSeller: false
    },
    global: {
      stubs: {
        Teleport: true,
        TooltipItem: { template: '<div data-testid="tooltip-item" />' }
      }
    }
  })
}

describe('TradeItem tooltip modes', () => {
  beforeEach(() => {
    mocks.reactiveConfig!.itemHoverTooltip = 'off'
    mocks.instances.length = 0
    mocks.tippy.mockReset()
    mocks.tippy.mockImplementation(makeInstance)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps off mode inert and mounts tooltip content lazily', async () => {
    const wrapper = mountRow()
    await nextTick()

    expect(mocks.tippy).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="tooltip-item"]').exists()).toBe(false)

    mocks.reactiveConfig!.itemHoverTooltip = 'always'
    await nextTick()
    expect(mocks.tippy).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="tooltip-item"]').exists()).toBe(false)

    await wrapper.find('tr').trigger('mouseenter')
    expect(wrapper.find('[data-testid="tooltip-item"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('reconfigures an existing row when the setting changes', async () => {
    mocks.reactiveConfig!.itemHoverTooltip = 'always'
    const wrapper = mountRow()
    await nextTick()
    const always = mocks.instances[0]

    mocks.reactiveConfig!.itemHoverTooltip = 'keybind'
    await nextTick()
    const keybind = mocks.instances[1]
    expect(always.destroy).toHaveBeenCalledOnce()
    expect(keybind.disable).toHaveBeenCalledOnce()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    expect(keybind.enable).toHaveBeenCalledOnce()
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }))
    expect(keybind.hide).toHaveBeenCalledOnce()
    expect(keybind.disable).toHaveBeenCalledTimes(2)

    mocks.reactiveConfig!.itemHoverTooltip = 'off'
    await nextTick()
    expect(keybind.destroy).toHaveBeenCalledOnce()
    expect(mocks.tippy).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })
})
