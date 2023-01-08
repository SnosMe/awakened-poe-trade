<template>
  <div class="flex gap-px">
    <template v-if="builtin">
      <button @click="open(false)" class="bg-gray-700 text-gray-400 rounded-l px-2">{{ t('Trade') }}</button>
      <button @click="open(true)" class="bg-gray-700 text-gray-400 rounded-r px-2"><i class="fas fa-external-link-alt text-xs" /></button>
    </template>
    <button v-else
      @click="open(true)" class="bg-gray-700 text-gray-400 rounded px-2">{{ t('Trade') }} <i class="fas fa-external-link-alt text-xs" /></button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Host } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import { PriceCheckWidget } from '@/web/overlay/widgets'

export default defineComponent({
  props: {
    getLink: {
      type: Function as PropType<() => string>,
      required: true
    }
  },
  setup (props) {
    const showBrowser = inject<(url: string) => void>('builtin-browser')!
    const { t } = useI18n()

    return {
      t,
      builtin: computed(() => {
        if (!Host.isElectron) return false
        const priceCheck = AppConfig('price-check') as PriceCheckWidget
        return priceCheck.builtinBrowser
      }),
      open (isExternal: boolean) {
        const link = props.getLink()
        if (isExternal) {
          window.open(link)
        } else {
          showBrowser(link)
        }
      }
    }
  }
})
</script>
