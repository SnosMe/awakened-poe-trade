import { computed, ref } from 'vue'
import { AppConfig } from '@/web/Config'

export const isLoading = ref(false)
export const error = ref<string | null>(null)
export const privateError = ref<string | null>(null)
export const tradeLeagues = ref<Array<{ id: string }>>([])
export const privateLeague = ref<{ id: string } | null>(null)
export const privateLoaded = ref<Boolean>(false)

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

export const isPrivateLeague = computed<Boolean | undefined>(() => {
  return selected.value ? !tradeLeagues.value.map(tl => tl.id).includes(selected.value) : false
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

const privateLeagueNameRegex = /.+\(PL\d+\)/

export async function loadPrivateLeague (privateLeagueName?: string) {
  isLoading.value = true
  privateLoaded.value = true
  privateLeague.value = null
  privateError.value = null
  // TODO Validate Private League Name?

  try {
    if (!privateLeagueName) {
      throw new Error('No Private League Name')
    }
    if (!privateLeagueNameRegex.test(privateLeagueName)) {
      throw new Error('Invalid Private League Name, Use the full name with the PL code')
    }

    const response = await fetch(`https://www.pathofexile.com/api/leagues/${privateLeagueName}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('League Not Found')
    privateLeague.value = await response.json()
    const privateLeagueCode = privateLeague.value?.id.match(/PL\d+/g)
    if (!privateLeagueCode || privateLeagueCode.length <= 0) {
      throw new Error('Invalid Private League Code Found')
    }
    const privateLeagueNumber = privateLeagueCode[0].replace('PL', '')
    const accessResponse = await fetch(`https://www.pathofexile.com/api/private-league-member/${privateLeagueNumber}`)
    if (!accessResponse.ok) {
      privateLeague.value = null
      throw new Error('You do not have access to this League. Please log in if you aren\'t!')
    }
  } catch (e) {
    privateError.value = (e as Error).message
  } finally {
    isLoading.value = false
  }
}
