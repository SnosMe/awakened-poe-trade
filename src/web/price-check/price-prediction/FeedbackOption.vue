<template>
  <ui-popper trigger="clickToToggle" boundaries-selector="#price-window" tag-name="div">
    <template slot="reference">
      <button class="bg-gray-700 px-2 opacity-25" :class="{ 'rounded-l': option === 'low', 'rounded-r': option === 'high' }"
        >{{ option }}</button>
    </template>
    <div class="popper">
      <form @submit.prevent="submit" class="w-64 text-left p-2">
        <div>{{ text }}</div>
        <textarea v-if="option !== 'fair'"
          v-model="feedbackText"
          placeholder="Why do you think so? (Not required)"
          rows="5" class="w-full bg-gray-700 text-gray-100 p-1"></textarea>
        <button class="btn" type="submit">Send feedback</button>
      </form>
    </div>
  </ui-popper>
</template>

<script>
import { sendFeedback } from './poeprices'

export default {
  props: {
    option: {
      type: String,
      required: true
    },
    prediction: {
      type: Object,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      feedbackText: ''
    }
  },
  computed: {
    text () {
      if (this.option === 'low') {
        return 'Predicted price is too low.'
      } else if (this.option === 'high') {
        return 'Predicted price is too high.'
      } else {
        return 'Predicted price is fair.'
      }
    }
  },
  methods: {
    submit () {
      this.$emit('sent')
      sendFeedback({
        text: this.feedbackText,
        option: this.option
      }, this.prediction, this.item)
    }
  }
}
</script>
