import { computed, shallowRef, readonly } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { AppConfig, poeWebApi } from '@/web/Config'
import { Host } from './IPC'

export const PERMANENT_LEAGUE_IDS = [
  // pc-ggg
  'Standard', 'Hardcore',
  // pc-garena
  '標準模式', '專家模式'
]

// pc-ggg, pc-garena
const PERMANENT_SC = ['Standard', '標準模式']
const PERMANENT_HC = ['Hardcore', '專家模式']

interface ApiLeague {
  id: string
  event?: boolean
  rules: Array<{ id: string }>
}

export const useLeagues = createGlobalState(() => {
  const isLoading = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const tradeLeagues = shallowRef<Array<{
    id: string
    isRuthless: boolean
    isPopular: boolean
  }>>([])

  const selectedId = computed<string | undefined>({
    get () {
      return (tradeLeagues.value.length)
        ? AppConfig().leagueId
        : undefined
    },
    set (id) {
      AppConfig().leagueId = id
    }
  })

  const selected = computed(() => {
    const { leagueId } = AppConfig()
    if (!tradeLeagues.value || !leagueId) return undefined
    return {
      id: leagueId,
      realm: AppConfig().realm,
      isPopular: !isPrivateLeague(leagueId) &&
        tradeLeagues.value.some(league => league.id === leagueId && league.isPopular)
    }
  })

  async function load () {
    isLoading.value = true
    error.value = null

    try {
      const response = await Host.proxy(`${poeWebApi()}/api/leagues?type=main&realm=pc`)
      if (!response.ok) throw new Error(JSON.stringify(Object.fromEntries(response.headers)))
      const leagues: ApiLeague[] = await response.json()
      tradeLeagues.value = leagues
        .filter(league => !league.rules.some(rule => rule.id === 'NoParties'))
        .map(league => {
          const isRuthless = league.rules.some(rule => rule.id === 'HardMode')
          const isPopular = league.event || (
            !PERMANENT_HC.includes(league.id) &&
            !isRuthless
          )
          return { id: league.id, isRuthless, isPopular }
        })

      const leagueIsAlive = tradeLeagues.value.some(league => league.id === selectedId.value)
      if (!leagueIsAlive && !isPrivateLeague(selectedId.value ?? '')) {
        if (tradeLeagues.value.length > 2) {
          const TMP_CHALLENGE = 2
          selectedId.value = tradeLeagues.value[TMP_CHALLENGE].id
        } else {
          const STANDARD = 0
          selectedId.value = tradeLeagues.value[STANDARD].id
        }
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    selectedId,
    selected,
    list: readonly(tradeLeagues),
    load
  }
})

function isPrivateLeague (id: string) {
  return /\(PL\d+\)$/.test(id)
}
