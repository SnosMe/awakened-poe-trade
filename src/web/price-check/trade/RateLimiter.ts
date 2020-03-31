import Vue from 'vue'

export class RateLimiter {
  state = Vue.observable({
    stack: [] as Promise<void>[],
    queue: 0
  })

  // eslint-disable-next-line no-useless-constructor
  constructor (
    public max: number,
    public window: number
  ) {}

  async wait (borrow = true) {
    return this._wait(borrow)
  }

  private async _wait (borrow: boolean, immediate = true): Promise<boolean> {
    if (this.state.stack.length === this.max) {
      this.state.queue++
      await this.state.stack[0]
      this.state.queue--
      return this._wait(borrow, false)
    } else {
      if (borrow) {
        this.push()
      }
      return immediate
    }
  }

  private push () {
    this.state.stack.push(new Promise((resolve) => {
      setTimeout(() => {
        this.state.stack.shift()
        resolve()
      }, this.window * 1000)
    }))
  }

  static async waitMulti (limiters: RateLimiter[]): Promise<void> {
    const res = await Promise.all(limiters.map(rl => rl.wait(false)))
    if (res.every(immediate => immediate)) {
      await Promise.all(limiters.map(rl => rl.wait()))
    } else {
      return this.waitMulti(limiters)
    }
  }
}
