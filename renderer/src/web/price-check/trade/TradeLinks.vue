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
import { defineComponent, PropType, inject } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    getLink: {
      type: Function as PropType<() => string>,
      required: true
    },
    builtin: {
      type: Boolean,
      default: false
    }
  },
  setup (props) {
    const showBrowser = inject<(url: string) => void>('builtin-browser')!
    const { t } = useI18n()

    return {
      t,
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
