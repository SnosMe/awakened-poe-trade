import { computed, shallowRef } from 'vue'

export function artificialSlowdown (ms: number) {
  const isReady = shallowRef(false)
  let tmid: ReturnType<typeof setTimeout> | null = null
  let datakey: unknown = null

  return {
    reset (value: unknown = Symbol()) {
      if (datakey !== value) {
        datakey = value
        if (tmid !== null) {
          clearTimeout(tmid)
          tmid = null
        }
        isReady.value = false
      }
    },
    isReady: computed(() => {
      if (tmid === null) {
        tmid = setTimeout(() => {
          isReady.value = true
        }, ms)
      }

      return isReady.value
    })
  }
}
