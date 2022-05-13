import { shallowRef, watch } from 'vue'
import { AppConfig } from '@/web/Config'
import { MainProcess } from '@/web/background/IPC'
import { selected as selectedLeague, isPublic as isPublicLeague } from './Leagues'

interface NinjaDenseInfo {
  chaos: number
  graph: Array<number | null>
  name: string
  variant?: string
}

export const chaosExaRate = shallowRef<number | undefined>(undefined)

type PriceDatabase = Array<{ ns: string, lines: string }>
let PRICES_DB: PriceDatabase = []
let lastUpdateTime = 0

const RETRY_TIME = 2 * 60 * 1000
const UPDATE_TIME = 16 * 60 * 1000

async function load (force: boolean = false) {
  if (!selectedLeague.value || !isPublicLeague.value || AppConfig().realm !== 'pc-ggg') return
  const leagueAtStartOfLoad = selectedLeague.value

  if (!force && (Date.now() - lastUpdateTime) < UPDATE_TIME) return

  const response = await fetch(`${MainProcess.CORS}https://poe.ninja/api/data/DenseOverviews?league=${leagueAtStartOfLoad}&language=en`)
  const jsonBlob = await response.text()

  if (leagueAtStartOfLoad === selectedLeague.value) {
    PRICES_DB = splitJsonBlob(jsonBlob)

    const exalted = findPriceByQuery({ ns: 'ITEM', name: 'Exalted Orb', variant: undefined })
    if (exalted && exalted.chaos >= 15) {
      chaosExaRate.value = exalted.chaos
    }

    lastUpdateTime = Date.now()
  }
}

function splitJsonBlob (jsonBlob: string): PriceDatabase {
  const NINJA_OVERVIEW = '{"type":"'
  const NAMESPACE_MAP: Array<[string, string[]]> = [
    ['ITEM', ['Currency', 'Fragment', 'DeliriumOrb', 'Scarab', 'Artifact', 'BaseType', 'Fossil', 'Resonator', 'Incubator', 'Oil', 'Vial', 'Invitation', 'BlightedMap', 'BlightRavagedMap', 'Essence', 'Map']],
    ['DIVINATION_CARD', ['DivinationCard']],
    ['CAPTURED_BEAST', ['Beast']],
    ['UNIQUE', ['UniqueJewel', 'UniqueFlask', 'UniqueWeapon', 'UniqueArmour', 'UniqueAccessory', 'UniqueMap']],
    ['GEM', ['SkillGem']]
  ]

  const byNamespace: PriceDatabase = []
  let startPos = jsonBlob.indexOf(NINJA_OVERVIEW)
  if (startPos === -1) return []

  while (true) {
    const endPos = jsonBlob.indexOf(NINJA_OVERVIEW, startPos + 1)

    const type = jsonBlob.slice(
      startPos + NINJA_OVERVIEW.length,
      jsonBlob.indexOf('"', startPos + NINJA_OVERVIEW.length)
    )
    const lines = jsonBlob.slice(startPos, (endPos === -1) ? jsonBlob.length : endPos)

    const isSupported = NAMESPACE_MAP.find(([_, types]) => types.includes(type))
    if (isSupported) {
      const found = byNamespace.find(({ ns }) => ns === isSupported[0])
      if (found) {
        found.lines += lines
      } else {
        byNamespace.push({ ns: isSupported[0], lines })
      }
    }

    if (endPos === -1) break
    startPos = endPos
  }
  return byNamespace
}

interface DbQuery {
  ns: string
  name: string
  variant: string | undefined
}

export function findPriceByQuery (query: DbQuery): NinjaDenseInfo | null {
  const lines = PRICES_DB.find(({ ns }) => ns === query.ns)?.lines
  if (!lines) return null

  // NOTE: order of keys is important
  const searchString = JSON.stringify({
    name: query.name,
    variant: query.variant,
    chaos: 0
  }).replace(':0}', ':')

  const startPos = lines.indexOf(searchString)
  if (startPos === -1) return null
  const endPos = lines.indexOf('}', startPos)

  return JSON.parse(lines.slice(startPos, endPos + 1))
}

export function autoCurrency (value: number, currency: 'chaos' | 'exa'): { min: number, max: number, currency: 'chaos' | 'exa' } {
  if (currency === 'chaos') {
    if (value > ((chaosExaRate.value || 9999) * 0.94)) {
      if (value < ((chaosExaRate.value || 9999) * 1.06)) {
        return { min: 1, max: 1, currency: 'exa' }
      } else {
        return { min: chaosToExa(value), max: chaosToExa(value), currency: 'exa' }
      }
    }
  } else if (currency === 'exa') {
    if (value < 1) {
      return { min: exaToChaos(value), max: exaToChaos(value), currency: 'chaos' }
    }
  }
  return { min: value, max: value, currency }
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
  chaosExaRate.value = undefined
  PRICES_DB = []
  load(true)
})
