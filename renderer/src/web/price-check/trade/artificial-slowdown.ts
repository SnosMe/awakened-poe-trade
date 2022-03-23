import { computed, shallowRef, triggerRef } from 'vue'

export function artificialSlowdown (ms: number) {
  const isReady = shallowRef(false)
  let tmid: ReturnType<typeof setTimeout> | null = null
  let datakey: unknown = null

  return {
    reset (value: unknown = Symbol('unique value')) {
      if (datakey !== value) {
        datakey = value
        if (tmid !== null) {
          clearTimeout(tmid)
          tmid = null
        }
        isReady.value = false
        // force reactivity, even if isReady was `false`
        triggerRef(isReady)
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
