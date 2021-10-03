import { computed, ref } from 'vue'
import { AppConfig } from '@/web/Config'

export const isLoading = ref(false)
export const error = ref<string | null>(null)
export const privateError = ref<string | null>(null)
export const tradeLeagues = ref<Array<{ id: string }>>([])
export const privateLeague = ref<{ id: string }| null>(null)

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

export async function load () {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch('https://api.pathofexile.com/leagues?type=main&realm=pc')
    if (!response.ok) throw new Error(JSON.stringify(Object.fromEntries(response.headers)))
    const leagues: Array<{ id: string, rules: Array<{ id: string }> }> = await response.json()
    tradeLeagues.value = leagues.filter(league => !league.rules.some(rule => rule.id === 'NoParties'))

    const leagueIsAlive = tradeLeagues.value.some(league => league.id === selected.value)
    if (!leagueIsAlive) {
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

export async function loadPrivateLeague (privateLeagueName?: string) {
  isLoading.value = true
  if (!privateLeagueName) {
    throw new Error('No Private League Name ?')
  }
  // TODO Validate Private League Name?
  try {
    const response = await fetch(`https://www.pathofexile.com/api/leagues/${privateLeagueName}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error(JSON.stringify(response.headers))
    privateLeague.value = await response.json()
  } catch (e) {
    privateError.value = (e as Error).message
    console.error(privateError.value)
  } finally {
    isLoading.value = false
  }
}
