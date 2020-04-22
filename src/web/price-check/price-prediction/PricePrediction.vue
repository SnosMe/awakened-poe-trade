<template>
  <div :style="{ 'min-height': !showContrib ? '70px' : undefined }">
    <div v-if="loading" class="py-2 flex justify-center pr-4">
      <div>
        <i class="fas fa-dna fa-spin text-gray-600"></i>
      </div>
      <div class="pl-2 text-center">
        <div>Getting price prediction...</div>
        <div class="text-gray-600">Powered by poeprices.info</div>
      </div>
    </div>
    <div v-else-if="price">
      <div class="flex items-center pb-4">
        <div class="flex items-center justify-center flex-1">
          <div class="w-8 h-8 flex items-center justify-center">
            <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
          </div>
          <i class="fas fa-arrow-right text-gray-600 px-2"></i>
          <span class="px-1 text-base">
            <span v-if="!showAsRange" class="text-gray-600 font-sans">~&nbsp;</span><span>{{ price.min | displayRounding }}</span>
            <template v-if="showAsRange"><span class="text-gray-600 font-sans">&nbsp;~&nbsp;</span>{{ price.max | displayRounding }}</template> ×</span>
          <div class="w-8 h-8 flex items-center justify-center">
            <img :src="currency.url" :alt="currency.text" class="max-w-full max-h-full">
          </div>
        </div>
        <div class="text-center">
          <div class="leading-tight">
            <i v-if="price.confidence < 70" class="fas fa-exclamation-triangle pr-1 text-orange-400"></i>
            <span>{{ price.confidence }}&nbsp;%</span>
          </div>
          <div class="text-xs text-gray-500 leading-none">Confidence</div>
        </div>
      </div>
      <div v-if="!showContrib" class="flex justify-between items-center">
        <button @click="showContrib = true" class="btn">Contribution to predicted price<i class="fas fa-chevron-down btn-icon ml-2"></i></button>
        <div class="flex" v-if="!feedbackSent && (price.confidence < 80)">
          <feedback-option :item="item" :prediction="price" @sent="feedbackSent = true" option="low" />
          <feedback-option :item="item" :prediction="price" @sent="feedbackSent = true" option="fair" />
          <feedback-option :item="item" :prediction="price" @sent="feedbackSent = true" option="high" />
        </div>
      </div>
      <table v-else>
        <thead>
          <th></th>
          <th class="text-gray-500 text-left font-normal pl-2">
            <button @click="showContrib = false">Contribution to predicted price<i class="fas fa-chevron-up btn-icon ml-2"></i></button>
          </th>
        </thead>
        <tbody class="align-top">
          <tr v-for="expl in price.explanation" :key="expl.name">
            <td class="text-right text-gray-500 whitespace-no-wrap">{{ expl.contrib }}&nbsp;%</td>
            <td class="pl-2 truncate w-full" style="max-width: 0;">{{ expl.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="error">
      <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script>
import { requestPoeprices } from './poeprices'
import { displayRounding } from '../Prices'
import FeedbackOption from './FeedbackOption'

export default {
  name: 'PricePrediction',
  components: { FeedbackOption },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  filters: { displayRounding },
  data () {
    return {
      price: null,
      error: null,
      loading: false,
      showContrib: false,
      feedbackSent: false
    }
  },
  watch: {
    item: {
      immediate: true,
      async handler (item) {
        try {
          this.loading = true
          this.error = null
          this.price = null
          this.showContrib = false
          this.feedbackSent = false
          this.price = await requestPoeprices(this.item)
        } catch (err) {
          this.error = err.message
        } finally {
          this.loading = false
        }
      }
    }
  },
  computed: {
    currency () {
      return {
        exalt: {
          url: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png?scale=1&w=1&h=1',
          text: 'exa'
        },
        chaos: {
          url: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png?scale=1&w=1&h=1',
          text: 'chaos'
        }
      }[this.price.currency]
    },
    showAsRange () {
      return displayRounding(this.price.min) !== displayRounding(this.price.max)
    }
  },
  methods: {
    //
  }
}
</script>
