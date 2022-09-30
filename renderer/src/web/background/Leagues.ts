import { computed, ref } from 'vue'
import { AppConfig, poeWebApi } from '@/web/Config'
import { MainProcess } from './IPC'

export const PERMANENT_LEAGUE_IDS = [
  // pc-ggg
  'Standard', 'Hardcore',
  // pc-garena
  '標準模式', '專家模式',
  '标准模式', '专家模式'
]

export const isLoading = ref(false)
export const error = ref<string | null>(null)
export const tradeLeagues = ref<Array<{ id: string }>>([])

export const selected = computed<string | undefined>({
  get () {
    return (tradeLeagues.value.length)
      ? AppConfig().leagueId
      : undefined
  },
  set (id) {
    AppConfig().leagueId = id
  }
})

export const isPublic = computed<boolean | undefined>(() =>
  selected.value ? isPublicLeague(selected.value) : undefined)

export function isPublicLeague (id: string) {
  return tradeLeagues.value.some(league => id === league.id)
}

export async function load () {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch(`${MainProcess.CORS}https://${poeWebApi()}/api/leagues?type=main&realm=pc`)
    if (!response.ok) throw new Error(JSON.stringify(Object.fromEntries(response.headers)))
    const leagues: Array<{ id: string, rules: Array<{ id: string }> }> = await response.json()
    tradeLeagues.value = leagues.filter(league => !league.rules.some(rule => rule.id === 'NoParties'))

    const leagueIsAlive = tradeLeagues.value.some(league => league.id === selected.value)
    if (!leagueIsAlive && isRegularLeague(selected.value!)) {
      if (tradeLeagues.value.length > 2) {
        const TMP_CHALLENGE = 2
        selected.value = tradeLeagues.value[TMP_CHALLENGE].id
      } else {
        const STANDARD = 0
        selected.value = tradeLeagues.value[STANDARD].id
      }
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    isLoading.value = false
  }
}

function isRegularLeague (id: string) {
  // not a Private League (PL01)
  // not a Race Event (.RE01)
  return /^[A-Za-z ]+$/.test(id)
}
