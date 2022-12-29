import { shallowRef, watch } from 'vue'
import { AppConfig } from '@/web/Config'
import { MainProcess } from '@/web/background/IPC'
import { selected as selectedLeague, isPublicLeague } from './Leagues'

interface NinjaDenseInfo {
  chaos: number
  graph: Array<number | null>
  name: string
  variant?: string
}

export const xchgRate = shallowRef<number | undefined>(undefined)

type PriceDatabase = Array<{ ns: string, url: string, lines: string }>
let PRICES_DB: PriceDatabase = []
let lastUpdateTime = 0

const RETRY_TIME = 2 * 60 * 1000
const UPDATE_TIME = 16 * 60 * 1000

async function load (force: boolean = false) {
  if (!selectedLeague.value || !isPublicLeague(selectedLeague.value) || AppConfig().realm !== 'pc-ggg') return
  const leagueAtStartOfLoad = selectedLeague.value

  if (!force && (Date.now() - lastUpdateTime) < UPDATE_TIME) return

  const response = await fetch(`${MainProcess.CORS}https://poe.ninja/api/data/DenseOverviews?league=${leagueAtStartOfLoad}&language=en`)
  const jsonBlob = await response.text()

  if (leagueAtStartOfLoad === selectedLeague.value) {
    PRICES_DB = splitJsonBlob(jsonBlob)

    const divine = findPriceByQuery({ ns: 'ITEM', name: 'Divine Orb', variant: undefined })
    if (divine && divine.chaos >= 30) {
      xchgRate.value = divine.chaos
    }

    lastUpdateTime = Date.now()
  }
}

function selectedLeagueToUrl (): string {
  const league = selectedLeague.value!
  switch (league) {
    case 'Standard': return 'standard'
    case 'Hardcore': return 'hardcore'
    default:
      return (league.startsWith('Hardcore ')) ? 'challengehc' : 'challenge'
  }
}

function denseInfoToDetailsId (info: NinjaDenseInfo): string {
  return ((info.variant) ? `${info.name}, ${info.variant}` : info.name)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9:\- ]/g, '')
    .toLowerCase()
    .replace(/ /g, '-')
}

function splitJsonBlob (jsonBlob: string): PriceDatabase {
  const NINJA_OVERVIEW = '{"type":"'
  const NAMESPACE_MAP: Array<{ ns: string, url: string, type: string }> = [
    { ns: 'ITEM', url: 'currency', type: 'Currency' },
    { ns: 'ITEM', url: 'fragments', type: 'Fragment' },
    { ns: 'ITEM', url: 'delirium-orbs', type: 'DeliriumOrb' },
    { ns: 'ITEM', url: 'scarabs', type: 'Scarab' },
    { ns: 'ITEM', url: 'artifacts', type: 'Artifact' },
    { ns: 'ITEM', url: 'base-types', type: 'BaseType' },
    { ns: 'ITEM', url: 'fossils', type: 'Fossil' },
    { ns: 'ITEM', url: 'resonators', type: 'Resonator' },
    { ns: 'ITEM', url: 'incubators', type: 'Incubator' },
    { ns: 'ITEM', url: 'oils', type: 'Oil' },
    { ns: 'ITEM', url: 'vials', type: 'Vial' },
    { ns: 'ITEM', url: 'invitations', type: 'Invitation' },
    { ns: 'ITEM', url: 'blighted-maps', type: 'BlightedMap' },
    { ns: 'ITEM', url: 'blight-ravaged-maps', type: 'BlightRavagedMap' },
    { ns: 'ITEM', url: 'essences', type: 'Essence' },
    { ns: 'ITEM', url: 'maps', type: 'Map' },
    { ns: 'DIVINATION_CARD', url: 'divination-cards', type: 'DivinationCard' },
    { ns: 'CAPTURED_BEAST', url: 'beasts', type: 'Beast' },
    { ns: 'UNIQUE', url: 'unique-jewels', type: 'UniqueJewel' },
    { ns: 'UNIQUE', url: 'unique-flasks', type: 'UniqueFlask' },
    { ns: 'UNIQUE', url: 'unique-weapons', type: 'UniqueWeapon' },
    { ns: 'UNIQUE', url: 'unique-armours', type: 'UniqueArmour' },
    { ns: 'UNIQUE', url: 'unique-accessories', type: 'UniqueAccessory' },
    { ns: 'UNIQUE', url: 'unique-maps', type: 'UniqueMap' },
    { ns: 'GEM', url: 'skill-gems', type: 'SkillGem' }
  ]

  const database: PriceDatabase = []
  let startPos = jsonBlob.indexOf(NINJA_OVERVIEW)
  if (startPos === -1) return []

  while (true) {
    const endPos = jsonBlob.indexOf(NINJA_OVERVIEW, startPos + 1)

    const type = jsonBlob.slice(
      startPos + NINJA_OVERVIEW.length,
      jsonBlob.indexOf('"', startPos + NINJA_OVERVIEW.length)
    )
    const lines = jsonBlob.slice(startPos, (endPos === -1) ? jsonBlob.length : endPos)

    const isSupported = NAMESPACE_MAP.find(entry => entry.type === type)
    if (isSupported) {
      database.push({ ns: isSupported.ns, url: isSupported.url, lines })
    }

    if (endPos === -1) break
    startPos = endPos
  }
  return database
}

interface DbQuery {
  ns: string
  name: string
  variant: string | undefined
}

export function findPriceByQuery (query: DbQuery) {
  // NOTE: order of keys is important
  const searchString = JSON.stringify({
    name: query.name,
    variant: query.variant,
    chaos: 0
  }).replace(':0}', ':')

  for (const { ns, url, lines } of PRICES_DB) {
    if (ns !== query.ns) continue

    const startPos = lines.indexOf(searchString)
    if (startPos === -1) continue
    const endPos = lines.indexOf('}', startPos)

    const info: NinjaDenseInfo = JSON.parse(lines.slice(startPos, endPos + 1))

    return {
      ...info,
      url: `https://poe.ninja/${selectedLeagueToUrl()}/${url}/${denseInfoToDetailsId(info)}`
    }
  }
  return null
}

export function autoCurrency (value: number | [number, number]): { min: number, max: number, currency: 'chaos' | 'div' } {
  if (Array.isArray(value)) {
    if (value[1] > (xchgRate.value || 9999)) {
      return { min: chaosToStable(value[0]), max: chaosToStable(value[1]), currency: 'div' }
    }
    return { min: value[0], max: value[1], currency: 'chaos' }
  }
  if (value > ((xchgRate.value || 9999) * 0.94)) {
    if (value < ((xchgRate.value || 9999) * 1.06)) {
      return { min: 1, max: 1, currency: 'div' }
    } else {
      return { min: chaosToStable(value), max: chaosToStable(value), currency: 'div' }
    }
  }
  return { min: value, max: value, currency: 'chaos' }
}

function chaosToStable (count: number) {
  return count / (xchgRate.value || 9999)
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
  xchgRate.value = undefined
  PRICES_DB = []
  load(true)
})
