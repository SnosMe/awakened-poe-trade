<template>
  <div :style="{ 'min-height': (loading || error) ? '4.5rem' : undefined }">
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
        <item-quick-price class="flex-1 text-base justify-center"
          :price="price"
          :item-img="item.info.icon"
          :item-base="item.info"
          approx
        />
        <div class="text-center">
          <div class="leading-tight">
            <i v-if="price.confidence < 78" class="fas fa-exclamation-triangle pr-1 text-orange-400"></i>
            <span>{{ price.confidence }}{{ '\u2009' }}%</span>
          </div>
          <div class="text-xs text-gray-500 leading-none">Confidence</div>
        </div>
      </div>
      <div v-if="!showContrib" class="flex justify-between items-center">
        <button @click="showContrib = true" class="btn">Contribution to predicted price<i class="fas fa-chevron-down btn-icon ml-2"></i></button>
        <div class="flex" v-if="!feedbackSent && (price.confidence < 83)">
          <button class="btn opacity-50 mr-1 flex items-center"
            @click="openWebsite"><i class="fas fa-external-link-alt"></i></button>
          <feedback-option :item="item" :prediction="price" @sent="feedbackSent = true" option="low" />
          <feedback-option :item="item" :prediction="price" @sent="feedbackSent = true" option="fair" />
          <feedback-option :item="item" :prediction="price" @sent="feedbackSent = true" option="high" />
        </div>
        <button v-else
          class="btn opacity-50" @click="openWebsite">by poeprices.info</button>
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
            <td class="text-right text-gray-500 whitespace-nowrap">{{ expl.contrib }}&nbsp;%</td>
            <td class="pl-2 truncate w-full" style="max-width: 0;">{{ expl.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <ui-error-box v-else-if="error">
      <template #name>Failed to get price prediction</template>
      <p>Error: {{ error }}</p>
    </ui-error-box>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref, PropType, computed } from 'vue'
import { getExternalLink, RareItemPrice, requestPoeprices } from './poeprices'
import FeedbackOption from './FeedbackOption.vue'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import { ParsedItem } from '@/parser'
import { artificialSlowdown } from '../trade/artificial-slowdown'

const slowdown = artificialSlowdown(800)

export default defineComponent({
  name: 'PricePrediction',
  components: { FeedbackOption, ItemQuickPrice },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const price = ref<RareItemPrice | null>(null)
    const error = ref<string | null>(null)
    const loading = ref(false)
    const showContrib = ref(false)
    const feedbackSent = ref(false)

    watch(() => props.item, async () => {
      try {
        loading.value = true
        error.value = null
        price.value = null
        showContrib.value = false
        feedbackSent.value = false
        price.value = await requestPoeprices(props.item)
      } catch (err) {
        error.value = (err as Error).message
      } finally {
        loading.value = false
      }
    }, { immediate: true })

    function openWebsite () {
      window.open(getExternalLink(props.item))
    }

    return {
      price,
      error,
      loading: computed(() => loading.value || !slowdown.isReady.value),
      showContrib,
      feedbackSent,
      openWebsite
    }
  }
})
</script>
