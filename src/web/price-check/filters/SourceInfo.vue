<template>
  <div>
    <div :class="$style['modinfo']">{{ modText }}</div>
    <div v-for="stat of stats" :key="stat.text" class="flex">
      <item-modifier-text :text="stat.text" :roll="stat.roll" :class="{ 'line-through': !stat.contributes }" />
      <div v-if="stat.contributes && stat.contribution" class="ml-auto">{{ stat.contribution }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { StatCalculated } from '@/parser/modifiers'
import { applyIncr } from '@/parser/advanced-mod-desc'
import { roundRoll } from './util'
import ItemModifierText from '@/web/ui/ItemModifierText.vue'

export default defineComponent({
  components: { ItemModifierText },
  props: {
    source: {
      type: Object as PropType<StatCalculated['sources'][number]>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    const modText = computed(() => {
      const { info } = props.source.modifier

      let text = t(info.type)
      if (info.name) {
        text += ` "${info.name}"`
      }
      if (info.tier != null) {
        text += ` (${t('Tier: {0}', [info.tier])})`
      }
      if (info.rank != null) {
        text += ` (${t('Rank: {0}', [info.rank])})`
      }
      return text
    })

    const stats = computed(() => {
      const { stats } = props.source.modifier
      const { stat: contribStat } = props.source.stat

      // TODO: percentRoll, isNegated
      const contribution = props.source.contributes?.value

      return stats.map((parsed) => {
        if (parsed.stat.ref !== contribStat.ref) {
          return {
            text: parsed.translation.string,
            contributes: false
          }
        }
        parsed = applyIncr(props.source.modifier.info, parsed) ?? parsed
        if (!parsed.roll) {
          return {
            text: parsed.translation.string,
            contribution: contribution,
            contributes: true
          }
        }

        const rollValue = parsed.roll.value * (parsed.translation.negate ? -1 : 1)
        return {
          text: parsed.translation.string,
          roll: roundRoll(rollValue, parsed.roll.dp),
          contribution: contribution!,
          contributes: true
        }
      })
    })

    return {
      modText,
      stats
    }
  }
})
</script>

<style lang="postcss" module>
.modinfo {
  @apply text-gray-500;
  font-style: italic;
}
</style>

<i18n>
{
  "en": {
    "implicit": "Implicit",
    "fractured": "Fractured",
    "explicit": "Explicit",
    "crafted": "Crafted"
  },
  "ru": {
    "implicit": "Собственное",
    "fractured": "Расколотый",
    "explicit": "Свойство",
    "crafted": "Мастерский",
    "Tier: {0}": "Уровень: {0}",
    "Rank: {0}": "Ранг: {0}"
  }
}
</i18n>
