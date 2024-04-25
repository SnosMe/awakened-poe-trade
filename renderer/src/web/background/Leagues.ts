import { computed, shallowRef, readonly } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { AppConfig, poeWebApi } from '@/web/Config'
import { Host } from './IPC'

// pc-ggg, pc-garena
// const PERMANENT_SC = ['Standard', '標準模式']
const PERMANENT_HC = ['Hardcore', '專家模式']

interface ApiLeague {
  id: string
  event?: boolean
  rules: Array<{ id: string }>
}

interface League {
  id: string
  isPopular: boolean
}

export const useLeagues = createGlobalState(() => {
  const isLoading = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const tradeLeagues = shallowRef<League[]>([])

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
    const listed = tradeLeagues.value.find(league => league.id === leagueId)
    return {
      id: leagueId,
      realm: AppConfig().realm,
      isPopular: !isPrivateLeague(leagueId) && Boolean(listed?.isPopular)
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
        .filter(league =>
          !PERMANENT_HC.includes(league.id) &&
          !league.rules.some(rule => rule.id === 'NoParties' ||
            (rule.id === 'HardMode' && !league.event)))
        .map(league => {
          return { id: league.id, isPopular: true }
        })

      const leagueIsAlive = tradeLeagues.value.some(league => league.id === selectedId.value)
      if (!leagueIsAlive && !isPrivateLeague(selectedId.value ?? '')) {
        if (tradeLeagues.value.length > 1) {
          const TMP_CHALLENGE = 1
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
  if (id.includes('Ruthless')) {
    return true
  }
  return /\(PL\d+\)$/.test(id)
}
