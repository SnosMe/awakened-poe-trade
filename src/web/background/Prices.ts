import { ref, watch } from 'vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { selected as selectedLeague } from './Leagues'
import { nameToDetailsId } from '../price-check/trends/getDetailsId'

interface NinjaCurrencyInfo { /* eslint-disable camelcase */
  currencyTypeName: string
  receive?: {
    get_currency_id: number
    value: number
  }
  pay?: {
    get_currency_id: number
    value: number
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
  sparkline: { data: Array<number | null>, totalChange: number }
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

const PRICE_BY_DETAILS_ID = new Map<string, ItemInfo>()

const RETRY_TIME = 60 * 1000
const UPDATE_TIME = 10 * 60 * 1000

export const chaosExaRate = ref<number | undefined>(undefined)

const priceQueue = [
  { overview: 'currency', type: 'Currency', loaded: 0 },
  { overview: 'currency', type: 'Fragment', loaded: 0 },
  { overview: 'item', type: 'Watchstone', loaded: 0 },
  { overview: 'item', type: 'Oil', loaded: 0 },
  { overview: 'item', type: 'Incubator', loaded: 0 },
  { overview: 'item', type: 'Scarab', loaded: 0 },
  { overview: 'item', type: 'Fossil', loaded: 0 },
  { overview: 'item', type: 'Resonator', loaded: 0 },
  { overview: 'item', type: 'Essence', loaded: 0 },
  { overview: 'item', type: 'DivinationCard', loaded: 0 },
  { overview: 'item', type: 'Prophecy', loaded: 0 },
  { overview: 'item', type: 'SkillGem', loaded: 0 },
  { overview: 'item', type: 'BaseType', loaded: 0 },
  // { overview: 'item', type: 'HelmetEnchant', loaded: 0 },
  { overview: 'item', type: 'BlightedMap', loaded: 0 },
  { overview: 'item', type: 'UniqueMap', loaded: 0 },
  { overview: 'item', type: 'Map', loaded: 0 },
  { overview: 'item', type: 'UniqueJewel', loaded: 0 },
  { overview: 'item', type: 'UniqueFlask', loaded: 0 },
  { overview: 'item', type: 'UniqueWeapon', loaded: 0 },
  { overview: 'item', type: 'UniqueArmour', loaded: 0 },
  { overview: 'item', type: 'UniqueAccessory', loaded: 0 },
  { overview: 'item', type: 'Beast', loaded: 0 },
  { overview: 'item', type: 'Vial', loaded: 0 },
  { overview: 'item', type: 'DeliriumOrb', loaded: 0 },
  { overview: 'item', type: 'Invitation', loaded: 0 }
]

async function load (force: boolean = false) {
  if (!selectedLeague.value) return
  const leagueAtStartOfLoad = selectedLeague.value

  for (const dataType of priceQueue) {
    if (!force) {
      if ((Date.now() - dataType.loaded) < UPDATE_TIME) continue
    }

    try {
      const response = await fetch(`${MainProcess.CORS}https://poe.ninja/api/data/${dataType.overview}overview?league=${leagueAtStartOfLoad}&type=${dataType.type}`)
      if (leagueAtStartOfLoad !== selectedLeague.value) return

      if (dataType.overview === 'currency') {
        const priceData: {
          lines: NinjaCurrencyInfo[]
          currencyDetails: Array<{
            id: number
            icon: string
          }>
        } = await response.json()

        for (const currency of priceData.lines) {
          if (!currency.receive) {
            continue
          }

          PRICE_BY_DETAILS_ID.set(currency.detailsId, {
            detailsId: currency.detailsId,
            icon: priceData.currencyDetails.find(detail => detail.id === currency.receive!.get_currency_id)!.icon,
            name: currency.currencyTypeName,
            receive: {
              chaosValue: currency.receive.value,
              graphPoints: currency.receiveSparkLine.data.filter((point): point is number => point != null),
              totalChange: currency.receiveSparkLine.totalChange
            }
          })

          if (currency.detailsId === 'exalted-orb') {
            const receive = currency.receive.value
            const pay = currency.pay?.value ? (1 / currency.pay.value) : undefined
            // sanity check, better poe.ninja to implement this on its own end
            if (pay) {
              if (pay >= 15 && receive >= 15 &&
                  (Math.min(receive, pay) / Math.max(receive, pay)) >= 0.75) {
                chaosExaRate.value = receive
              } else {
                // fallback to sell price
                chaosExaRate.value = (pay >= 15) ? pay : undefined
              }
            } else {
              chaosExaRate.value = (receive >= 15) ? receive : undefined
            }
          }
        }
      } else if (dataType.overview === 'item') {
        const priceData: {
          lines: NinjaItemInfo[]
        } = await response.json()
        for (const item of priceData.lines) {
          const detailsId = dataType.type === 'UniqueFlask' // seems poe.ninja keeps this for compatability
            ? nameToDetailsId(`${item.detailsId} ${item.baseType}`)
            : item.detailsId

          PRICE_BY_DETAILS_ID.set(detailsId, {
            detailsId,
            icon: item.icon,
            name: item.name,
            receive: {
              chaosValue: item.chaosValue,
              graphPoints: item.sparkline.data.filter((point): point is number => point != null),
              totalChange: item.sparkline.totalChange
            }
          })
        }
      }

      dataType.loaded = Date.now()
    } catch (e) {}
  }
}

export function findByDetailsId (id: string) {
  return PRICE_BY_DETAILS_ID.get(id)
}

export function autoCurrency (value: number, currency: string) {
  if (currency === 'c') {
    if (value > ((chaosExaRate.value || 9999) * 0.94)) {
      if (value < ((chaosExaRate.value || 9999) * 1.06)) {
        return { val: 1, curr: 'e' }
      } else {
        return { val: chaosToExa(value), curr: 'e' }
      }
    }
  } else if (currency === 'e') {
    if (value < 1) {
      return { val: exaToChaos(value), curr: 'c' }
    }
  }
  return { val: value, curr: currency }
}

function chaosToExa (count: number) {
  return count / (chaosExaRate.value || 9999)
}

function exaToChaos (count: number) {
  return count * (chaosExaRate.value || 9999)
}

export function displayRounding (value: number, fraction: boolean = false): string {
  if (fraction && Math.abs(value) < 1) {
    if (value === 0) return '0'
    const r = `1\u200A/\u200A${displayRounding(1 / value)}`
    return r === '1\u200A/\u200A1' ? '1' : r
  }
  if (Math.abs(value) < 10) {
    return Number(value.toFixed(1)).toString().replace('.', '\u200A.\u200A')
  }
  return Math.round(value).toString()
}

// ---

setInterval(() => {
  load()
}, RETRY_TIME)

watch(selectedLeague, () => {
  load(true)
})
