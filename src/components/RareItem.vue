<template>
  <div v-if="loading">
    <i class="fas fa-exclamation-circle pr-1 text-gray-600"></i>
    <span>Getting price prediction...</span>
  </div>
  <div v-else-if="price">
    <div class="flex items-center pb-4">
      <div class="flex items-center justify-center flex-1">
        <div class="w-8 h-8 flex items-center justify-center">
          <img :src="item.computed.icon" :alt="item.name" class="max-w-full max-h-full">
        </div>
        <i class="fas fa-arrow-right text-gray-600 px-2"></i>
        <span class="px-1 text-base">
          <span v-if="price.min === price.max" class="text-gray-600 font-sans">~&nbsp;</span><span>{{ price.min }}</span>
          <template v-if="price.min !== price.max"><span class="text-gray-600 font-sans">&nbsp;~&nbsp;</span>{{ price.max }}</template> ×</span>
        <div class="w-8 h-8 flex items-center justify-center">
          <img :src="currency.icon" :alt="currency.name" class="max-w-full max-h-full">
        </div>
      </div>
      <div class="text-center">
        <div class="leading-tight">
          <i v-if="price.confidence < 70" class="fas fa-exclamation-circle pr-1 text-orange-500"></i>
          <span>{{ price.confidence }}&nbsp;%</span>
        </div>
        <div class="text-xs text-gray-500 leading-none">Confidence</div>
      </div>
    </div>
    <table>
      <thead>
        <th></th>
        <th class="text-gray-500 text-left font-normal pl-2">Contribution to predicted price</th>
      </thead>
      <tbody class="align-top">
        <tr v-for="expl in price.explanation" :key="expl.name">
          <td class="text-right text-gray-500">{{ expl.contrib }}&nbsp;%</td>
          <td class="pl-2 truncate w-full" style="max-width: 0;">{{ expl.name }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4">
      <i class="fas fa-exclamation-triangle pr-1 text-orange-600"></i>
      <span class="font-sans text-orange-200">poeprices.info: &laquo;Our services (web & API) will be shutdown during 01/22/2020 to 01/26/2020 due to service upgrade. We will put it back ASAP. Sorry about the inconvenience.&raquo;</span>
    </div>
    <div class="mt-6">
      <i class="fas fa-exclamation-circle pr-1 text-gray-600"></i>
      <span class="text-gray-400">Search by modifiers will be available in the next release</span>
      <modifiers-picker class="mt-2" :item="item" />
    </div>
  </div>
  <div v-else-if="error">
    <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
    <span>{{ error }}</span>
    <div class="mt-4">
      <i class="fas fa-exclamation-triangle pr-1 text-orange-600"></i>
      <span class="font-sans text-orange-200">poeprices.info: &laquo;Our services (web & API) will be shutdown during 01/22/2020 to 01/26/2020 due to service upgrade. We will put it back ASAP. Sorry about the inconvenience.&raquo;</span>
    </div>
  </div>
</template>

<script>
import { requestPoeprices } from './poeprices'
import { Prices } from './Prices'
import ModifiersPicker from './ModifiersPicker'

export default {
  name: 'RareItem',
  components: { ModifiersPicker },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      price: null,
      error: null,
      loading: false
    }
  },
  watch: {
    item: {
      immediate: true,
      async handler (item) {
        try {
          this.loading = true
          this.price = null
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
      return Prices.findByDetailsId(this.price.currency)
    }
  }
}
</script>
