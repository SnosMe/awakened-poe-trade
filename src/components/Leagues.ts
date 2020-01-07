import Vue from 'vue'

export class LeaguesService {
  private state = Vue.observable({
    isLoading: false,
    isLoaded: false,
    loadingError: undefined as string | undefined,
    leagues: [] as string[],
    selected: ''
  })

  get isLoading () { return this.state.isLoading }

  get isLoaded () { return this.state.isLoaded }

  get loadingError () { return this.state.loadingError }

  get leagues () {
    return (this.state.isLoaded)
      ? this.state.leagues
      : null
  }

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

    this.state.leagues = tradeLeagues.map(league => league.id)
    this.state.selected = this.state.leagues[2] // @TODO
    this.state.isLoading = false
    this.state.isLoaded = true
  }
}

export const Leagues = new LeaguesService()
