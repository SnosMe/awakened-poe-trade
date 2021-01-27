import { reactive } from 'vue'

export class RateLimiter {
  state = reactive({
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

  private async _wait (borrow: boolean): Promise<void> {
    if (this._destroyed) throw new Error('RateLimiter is no longer active')

    if (this.isFullyUtilized()) {
      this.state.queue++
      await this.state.stack[0]
      this.state.queue--
      return this._wait(borrow)
    } else {
      if (borrow) {
        this.push()
      }
    }
  }

  private push () {
    const handle = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.state.stack = this.state.stack.filter(entry => entry !== handle)
        resolve()
      }, this.window * 1000)
    })
    this.state.stack.push(handle)
  }

  static async waitMulti (limiters: RateLimiter[]): Promise<void> {
    await Promise.all(limiters.map(rl => rl.wait(false)))
    if (limiters.every(rl => !rl.isFullyUtilized())) {
      limiters.forEach(rl => rl.wait())
    } else {
      return this.waitMulti(limiters)
    }
  }

  isEqualLimit (other: { max: number, window: number }) {
    return this.max === other.max &&
      this.window === other.window
  }

  isFullyUtilized () {
    return this.state.stack.length >= this.max
  }

  destroy () {
    this._destroyed = true
  }

  toString () {
    return `RateLimiter<max=${this.max}:window=${this.window}>: (stack=${this.state.stack.length},queue=${this.state.queue})`
  }
}
