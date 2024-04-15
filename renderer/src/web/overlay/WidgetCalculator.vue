<template>
  <widget :config="config" move-handles="corners" :removable="false">
    <div id="calc-window" class="widget-default-style flex flex-col p-1 gap-1" style="min-width: 14rem;">
      <div class="widget-default-style flex flex-row justify-between items-center">
        <div class="text-gray-100 flex-1 flex flex-row items-center p-1">
          <div v-if="stableOrbCost"><i class="fas fa-exchange-alt" /> {{ stableOrbCost }}</div>
          <i v-else-if="xchgRateLoading()" class="fas fa-dna fa-spin px-2" />
          <div v-else class="w-8" />
        </div>
        <div class="text-gray-100 m-1 leading-4 text-center">{{ t('calculator.title') }}</div>
        <div class="flex-1" />
      </div>
      <div class="flex p-1 bg-gray-800 rounded">
        <input v-model="expression" type="text" :placeholder="t('calculator.formula_input')" spellcheck="false"
          class="flex-1 bg-transparent p-1">
      </div>
      <div class="inline-grid gap-1" style="grid-template-columns: 1fr 30px 1fr;">
        <currency-split :amount="result" :currencies="[divine, chaos]"
          class="col-span-3 justify-center bg-gray-800 rounded" />
        <currency-split :amount="result" :currencies="[divine]" :round-precision="2"
          class="justify-end bg-gray-800 rounded" />
        <div class="flex items-center justify-center bg-gray-800 rounded"><i class="fas fa-equals text-xl" /></div>
        <currency-split :amount="result" :currencies="[chaos]" class="justify-start bg-gray-800 rounded" />
      </div>
    </div>
  </widget>
</template>
  
<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Widget from './Widget.vue'
import { WidgetManager, CalculatorWidget } from './interfaces'
import { usePoeninja } from '../background/Prices'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import CurrencySplit from '@/web/ui/CurrencySplit.vue'
import MathParser from './mathParser'

const props = defineProps<{
  config: CalculatorWidget
}>()

const { t } = useI18n()

const wm = inject<WidgetManager>('wm')!
const mathParser = new MathParser()
const { xchgRate, initialLoading: xchgRateLoading, queuePricesFetch } = usePoeninja()
queuePricesFetch()

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.anchor = {
    pos: 'cc',
    x: (Math.random() * (60 - 40) + 40),
    y: (Math.random() * (60 - 40) + 40)
  }
  wm.show(props.config.wmId)
}
props.config.wmFlags = ['invisible-on-blur']

const expression = ref('')

const stableOrbCost = computed(() => Math.round(xchgRate.value ?? 0))
const result = computed((): number => {
  const newVal = mathParser.evaluate(expression.value, { 'c': 1, 'd': stableOrbCost.value! })
  return isNaN(newVal) ? result.value : newVal
})

const divine = computed(() => ({ name: 'd', value: stableOrbCost.value, image: '/images/divine.png' }))
const chaos = computed(() => ({ name: 'c', value: 1, image: '/images/chaos.png' }))

</script>