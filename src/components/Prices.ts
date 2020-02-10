import Vue from 'vue'
import { MainProcess } from './main-process-bindings'
import { Leagues } from './Leagues'
import { nameToDetailsId } from './trends/getDetailsId'

/* eslint-disable camelcase */
interface NinjaCurrencyInfo {
  currencyTypeName: string
  receive: {
    league_id: number
    pay_currency_id: number
    get_currency_id: number
    count: number
    value: number
    includes_secondary: boolean
  }
  receiveSparkLine: {
    data: Array<number | null>
    totalChange: number
  }
  chaosEquivalent: number
  lowConfidenceReceiveSparkLine: {
    data: number[]
    totalChange: number
  }
  detailsId: string
}
/* eslint-enable camelcase */

interface NinjaItemInfo {
  id: number
  name: string
  icon: string
  mapTier: number
  levelRequired: number
  baseType: string | null
  stackSize: number
  variant: null
  prophecyText: null
  artFilename: null
  links: number
  itemClass: number
  sparkline: { data: number[], totalChange: number }
  lowConfidenceSparkline: { data: number[], totalChange: number[] }
  implicitModifiers: []
  explicitModifiers: Array<{ text: string, optional: boolean }>
  flavourText: string
  corrupted: false
  gemLevel: number
  gemQuality: number
  itemType: string
  chaosValue: number
  exaltedValue: number
  count: number
  detailsId: string
}

export interface ItemInfo {
  name: string
  icon: string
  receive: {
    chaosValue: number
    graphPoints: number[]
    totalChange: number
  }
  detailsId: string
}

const PRICE_DATA = [
  { overview: 'currency', type: 'Currency' },
  { overview: 'currency', type: 'Fragment' },
  { overview: 'item', type: 'Watchstone' },
  { overview: 'item', type: 'Oil' },
  { overview: 'item', type: 'Incubator' },
  { overview: 'item', type: 'Scarab' },
  { overview: 'item', type: 'Fossil' },
  { overview: 'item', type: 'Resonator' },
  { overview: 'item', type: 'Essence' },
  { overview: 'item', type: 'DivinationCard' },
  { overview: 'item', type: 'Prophecy' },
  { overview: 'item', type: 'SkillGem' },
  { overview: 'item', type: 'BaseType' },
  { overview: 'item', type: 'HelmetEnchant' },
  { overview: 'item', type: 'UniqueMap' },
  { overview: 'item', type: 'Map' },
  { overview: 'item', type: 'UniqueJewel' },
  { overview: 'item', type: 'UniqueFlask' },
  { overview: 'item', type: 'UniqueWeapon' },
  { overview: 'item', type: 'UniqueArmour' },
  { overview: 'item', type: 'UniqueAccessory' },
  { overview: 'item', type: 'Beast' }
] as const

const PRICE_BY_DETAILS_ID = new Map<string, ItemInfo>()

class PriceService {
  private state = Vue.observable({
    isLoading: false,
    isLoaded: false,
    loadingError: undefined as string | undefined,
    leagues: [] as string[],
    selected: '',
    chaosExaRate: 1
  })

  get isLoading () { return this.state.isLoading }

  get isLoaded () { return this.state.isLoaded }

  get loadingError () { return this.state.loadingError }

  get selected () {
    return (this.state.isLoaded)
      ? this.state.selected
      : null
  }

  async load () {
    this.state.isLoading = true

    for (const dataType of PRICE_DATA) {
      try {
        const response = await fetch(`${MainProcess.CORS}https://poe.ninja/api/data/${dataType.overview}overview?league=${Leagues.selected}&type=${dataType.type}`)

        if (dataType.overview === 'currency') {
          const priceData: {
            lines: NinjaCurrencyInfo[],
            currencyDetails: Array<{
              id: number
              icon: string
              name: string
              poeTradeId: number
            }>
          } = await response.json()

          for (const currency of priceData.lines) {
            PRICE_BY_DETAILS_ID.set(currency.detailsId, {
              detailsId: currency.detailsId,
              icon: priceData.currencyDetails.find(detail => detail.id === currency.receive.get_currency_id)!.icon,
              name: currency.currencyTypeName,
              receive: {
                chaosValue: currency.receive.value,
                graphPoints: currency.receiveSparkLine.data.filter(d => d != null),
                totalChange: currency.receiveSparkLine.totalChange
              }
            } as ItemInfo)
          }

          PRICE_BY_DETAILS_ID.set('chaos-orb', {
            detailsId: 'chaos-orb',
            icon: priceData.currencyDetails.find(detail => detail.name === 'Chaos Orb')!.icon,
            name: 'Chaos Orb'
          } as ItemInfo)
        } else if (dataType.overview === 'item') {
          const priceData: {
            lines: NinjaItemInfo[]
          } = await response.json()
          for (const item of priceData.lines) {
            const detailsId = dataType.type === 'UniqueFlask'
              ? nameToDetailsId(`${item.name} ${item.baseType}`) // seems poe.ninja keeps this for compatability
              : item.detailsId

            PRICE_BY_DETAILS_ID.set(detailsId, {
              detailsId,
              icon: item.icon,
              name: item.name,
              receive: {
                chaosValue: item.chaosValue,
                graphPoints: item.sparkline.data.filter(d => d != null),
                totalChange: item.sparkline.totalChange
              }
            } as ItemInfo)
          }
        }
      } catch (e) {
        // @TODO: poeninja often returns empty document body, retry failed
        console.log(e)
      }
    }

    this.state.isLoading = false
    this.state.isLoaded = true

    this.state.chaosExaRate = this.findByDetailsId('exalted-orb')!.receive.chaosValue
  }

  private assertReady () {
    if (!this.isLoaded) {
      throw new Error('Prices service not ready yet')
    }
  }

  findByDetailsId (id: string) {
    this.assertReady()

    return PRICE_BY_DETAILS_ID.get(id)
  }

  autoCurrency (value: number, currency: string) {
    if (currency === 'c') {
      if (value > (this.state.chaosExaRate * 0.94)) {
        if (value < (this.state.chaosExaRate * 1.06)) {
          return { val: 1, curr: 'e' }
        } else {
          return { val: this.chaosToExa(value), curr: 'e' }
        }
      }
    } else if (currency === 'e') {
      if (value < 1) {
        return { val: this.exaToChaos(value), curr: 'c' }
      }
    }
    return { val: value, curr: currency }
  }

  chaosToExa (count: number) {
    this.assertReady()

    return count / this.state.chaosExaRate
  }

  exaToChaos (count: number) {
    this.assertReady()

    return count * this.state.chaosExaRate
  }
}

export const Prices = new PriceService()

export function displayRounding (value: number, fraction: boolean = false): string {
  if (fraction && Math.abs(value) < 1) {
    if (value === 0) return '0'
    return `1/${displayRounding(1 / value)}`
  }
  if (Math.abs(value) < 10) {
    return Number(value.toFixed(1)).toString()
  }
  return Math.round(value).toString()
}
