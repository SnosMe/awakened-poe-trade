<template>
  <div>
    <price-prediction :item="item" />
    <modifiers-picker class="mt-4" :item="item" />
  </div>
</template>

<script>
import PricePrediction from './price-prediction/PricePrediction'
import ModifiersPicker from './ModifiersPicker'

export default {
  name: 'RareItem',
  components: {
    ModifiersPicker,
    PricePrediction
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  }
}
</script>
