import { computed } from 'vue'
import type { PropType } from 'vue'
import type { Config } from '@/web/Config'
import type { Widget } from '@/web/overlay/interfaces'

export function configProp<T = undefined> () {
  return {
    config: {
      type: Object as PropType<Config>,
      required: true as const
    },
    configWidget: {
      type: Object as PropType<T>,
      default: undefined as unknown as T
    }
  }
}

export function configModelValue<ObjectT extends object, KeyT extends keyof ObjectT> (
  getObj: () => ObjectT,
  key: KeyT
) {
  return computed<ObjectT[KeyT]>({
    get () {
      return getObj()[key]
    },
    set (value) {
      getObj()[key] = value
    }
  })
}

export function findWidget<T extends Widget> (type: string, config: Config) {
  return config.widgets.find(w => w.wmType === type) as T | undefined
}
