import Vue from 'vue'
import { MainProcess } from './main-process-bindings'
import { League } from '@/shared/types'
import { Prices } from './Prices'
import { Config } from './Config'

export class LeaguesService {
  private state = Vue.observable({
    isLoading: false,
    isLoaded: false,
    loadingError: undefined as string | undefined,
    selected: ''
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
    this.state.loadingError = undefined

    try {
      const response = await fetch('https://api.pathofexile.com/leagues?type=main&realm=pc&compact=1')
      const leagues: Array<{ id: string }> = await response.json()
      const tradeLeagues = leagues.filter(league => !league.id.startsWith('SSF '))

      const leagueIsAlive = tradeLeagues.some(league => league.id === Config.store.leagueId)

      if (leagueIsAlive) {
        this.state.selected = Config.store.leagueId!
      } else {
        if (tradeLeagues.length > 2) {
          const TMP_STANDARD = 2
          this.state.selected = tradeLeagues[TMP_STANDARD].id
        } else {
          const STANDARD = 0
          this.state.selected = tradeLeagues[STANDARD].id
        }
      }

      MainProcess.sendLeaguesReady(tradeLeagues.map(league => ({
        id: league.id,
        selected: league.id === this.state.selected
      } as League)))

      this.state.isLoaded = true
    } catch (e) {
      this.state.loadingError = e.message
    }

    this.state.isLoading = false
  }

  constructor () {
    MainProcess.addEventListener('league-selected', (e) => {
      const leagueId = (e as CustomEvent<string>).detail
      this.state.selected = leagueId
      Prices.load(true)
    })
  }
}

export const Leagues = new LeaguesService()
