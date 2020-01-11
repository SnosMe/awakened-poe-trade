import Vue from 'vue'
import { ipcRenderer } from 'electron'
import { League } from '@/shared/types'
import { LEAGUES_READY, LEAGUE_SELECTED } from '@/shared/ipc-event'
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

    ipcRenderer.send(LEAGUES_READY, tradeLeagues.map(league => ({
      id: league.id,
      selected: league.id === this.state.selected
    } as League)))

    this.state.isLoading = false
    this.state.isLoaded = true
  }

  constructor () {
    ipcRenderer.on(LEAGUE_SELECTED, (e, leagueId: string) => {
      this.state.selected = leagueId
      Prices.load()
    })
  }
}

export const Leagues = new LeaguesService()
