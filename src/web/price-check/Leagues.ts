import Vue from 'vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { LEAGUE_SELECTED } from '@/ipc/ipc-event'
import { League } from '@/ipc/types'
import { Prices } from './Prices'
import { Config } from '@/web/Config'

export class LeaguesService {
  private state = Vue.observable({
    isLoading: false,
    isLoaded: false,
    loadingError: undefined as string | undefined,
    tradeLeagues: [] as Array<{ id: string }>
  })

  get isLoading () { return this.state.isLoading }

  get isLoaded () { return this.state.isLoaded }

  get loadingError () { return this.state.loadingError }

  get selected () {
    return (this.state.isLoaded)
      ? Config.store.leagueId
      : undefined
  }

  set selected (id: string | undefined) {
    Config.store.leagueId = id
  }

  async load () {
    this.state.isLoading = true
    this.state.loadingError = undefined

    try {
      const response = await fetch('https://api.pathofexile.com/leagues?type=main&realm=pc&compact=1')
      if (!response.ok) throw new Error(JSON.stringify(Object.fromEntries(response.headers)))
      const leagues: Array<{ id: string }> = await response.json()
      const tradeLeagues = leagues.filter(league => !league.id.startsWith('SSF '))
      this.state.tradeLeagues = tradeLeagues

      const leagueIsAlive = tradeLeagues.some(league => league.id === Config.store.leagueId)

      if (!leagueIsAlive) {
        if (tradeLeagues.length > 2) {
          const TMP_CHALLENGE = 2
          this.selected = tradeLeagues[TMP_CHALLENGE].id
        } else {
          const STANDARD = 0
          this.selected = tradeLeagues[STANDARD].id
        }
      }

      this.state.isLoaded = true

      MainProcess.sendLeaguesReady(tradeLeagues.map(league => ({
        id: league.id,
        selected: league.id === this.selected
      } as League)))
    } catch (e) {
      this.state.loadingError = e.message
    }

    this.state.isLoading = false
  }

  constructor () {
    MainProcess.addEventListener(LEAGUE_SELECTED, (e) => {
      const leagueId = (e as CustomEvent<string>).detail
      this.selected = leagueId
      Prices.load(true)
    })
  }
}

export const Leagues = new LeaguesService()
