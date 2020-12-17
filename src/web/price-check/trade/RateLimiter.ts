import Vue from 'vue'

export class RateLimiter {
  state = Vue.observable({
    stack: [] as Promise<void>[],
    queue: 0
  })

  private _destroyed = false

  // eslint-disable-next-line no-useless-constructor
  constructor (
    public max: number,
    public window: number
  ) {}

  async wait (borrow = true) {
    return this._wait(borrow)
  }

  private async _wait (borrow: boolean, immediate = true): Promise<boolean> {
    if (this._destroyed) throw new Error('RateLimiter is no longer active')

    if (this.state.stack.length >= this.max) {
      this.state.queue++
      await this.state.stack[0]
      this.state.queue--
      return this._wait(borrow, false)
    } else {
      if (borrow) {
        this.push()
        if (this.state.stack.length === this.max) {
          this.push(1.75 * 1000)
        }
      }
      return immediate
    }
  }

  private push (extraTime = 0) {
    const handle = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.state.stack = this.state.stack.filter(entry => entry !== handle)
        resolve()
      }, this.window * 1000 + extraTime)
    })
    this.state.stack.push(handle)
  }

  static async waitMulti (limiters: RateLimiter[]): Promise<void> {
    const res = await Promise.all(limiters.map(rl => rl.wait(false)))
    if (res.every(immediate => immediate)) {
      await Promise.all(limiters.map(rl => rl.wait()))
    } else {
      return this.waitMulti(limiters)
    }
  }

  isEqualLimit (other: { max: number, window: number }) {
    return this.max === other.max &&
      this.window === other.window
  }

  destroy () {
    this._destroyed = true
  }

  toString () {
    return `RateLimiter<max=${this.max}:window=${this.window}>: (stack=${this.state.stack.length},queue=${this.state.queue})`
  }
}
