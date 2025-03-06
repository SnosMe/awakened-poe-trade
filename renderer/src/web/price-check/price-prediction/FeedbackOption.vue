<template>
  <ui-popover tag-name="div" trigger="click" placement="bottom" boundary="#price-window">
    <template #target>
      <button class="bg-gray-700 px-2 py-1 text-gray-400 leading-none opacity-50" :class="{ 'rounded-l': option === 'low', 'rounded-r': option === 'high' }"
        >{{ option }}</button>
    </template>
    <template #content>
      <form @submit.prevent="submit" class="w-64 p-2">
        <div>{{ text }}</div>
        <textarea v-if="option !== 'fair'"
          v-model="feedbackText"
          placeholder="Why do you think so? (Not required)"
          rows="5" class="w-full bg-gray-700 text-gray-100 p-1"></textarea>
        <button class="btn" type="submit">Send feedback</button>
        <span class="ml-2">to poeprices.info</span>
      </form>
    </template>
  </ui-popover>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import UiPopover from '@/web/ui/Popover.vue'
import { ParsedItem } from '@/parser'
import { sendFeedback } from './poeprices'

export default defineComponent({
  emits: ['sent'],
  components: { UiPopover },
  props: {
    option: {
      type: String as PropType<'fair' | 'low' | 'high'>,
      required: true
    },
    prediction: {
      type: Object as PropType<{ min: number, max: number, currency: 'chaos' | 'div' }>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props, ctx) {
    const feedbackText = ref('')

    const text = computed(() => {
      if (props.option === 'low') {
        return 'Predicted price is too low.'
      } else if (props.option === 'high') {
        return 'Predicted price is too high.'
      } else {
        return 'Predicted price is fair.'
      }
    })

    function submit () {
      ctx.emit('sent')
      sendFeedback({
        text: feedbackText.value,
        option: props.option
      }, {
        min: props.prediction.min,
        max: props.prediction.max,
        currency: (props.prediction.currency === 'div') ? 'divine' : 'chaos'
      }, props.item)
    }

    return {
      feedbackText,
      text,
      submit
    }
  }
})
</script>
