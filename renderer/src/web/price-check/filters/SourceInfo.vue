<template>
  <div>
    <div :class="$style['modinfo']">{{ modText }}</div>
    <div v-for="stat of stats" :key="stat.text" class="flex items-baseline">
      <item-modifier-text :text="stat.text" :roll="stat.roll" :class="{ 'line-through': !stat.contributes }" />
      <div v-if="stat.contributes && stat.contribution" :class="$style['contribution']">{{ stat.contribution }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyIncr } from '@/parser/advanced-mod-desc'
import { roundRoll } from './util'
import ItemModifierText from '@/web/ui/ItemModifierText.vue'
import type { StatCalculated } from '@/parser/modifiers'
import type { StatFilter } from './interfaces'

export default defineComponent({
  components: { ItemModifierText },
  props: {
    source: {
      type: Object as PropType<StatCalculated['sources'][number]>,
      required: true
    },
    filter: {
      type: Object as PropType<StatFilter>,
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

      let contribution = props.source.contributes?.value
      if (contribution != null) {
        const filter = props.filter.roll!
        contribution *= (filter.isNegated) ? -1 : 1
        contribution = roundRoll(contribution, filter.dp)
      }

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

.contribution {
  margin-left: auto;
  @apply w-12;
  @apply rounded;
  @apply border border-gray-700;
  text-align: center;
  flex-shrink: 0;
}
</style>

<i18n>
{
  "en": {
    "implicit": "Implicit",
    "fractured": "Fractured",
    "explicit": "Explicit",
    "crafted": "Crafted",
    "scourge": "Scourge"
  },
  "ru": {
    "implicit": "Собственное",
    "fractured": "Расколотый",
    "explicit": "Свойство",
    "crafted": "Мастерский",
    "scourge": "Преображённое",
    "Tier: {0}": "Уровень: {0}",
    "Rank: {0}": "Ранг: {0}"
  },
  "zh_CN": {
    "implicit": "基底",
    "fractured": "分裂",
    "explicit": "固定",
    "crafted": "工艺",
    "scourge": "天灾",
    "Tier: {0}": "等阶: {0}",
    "Rank: {0}": "级别: {0}"
  }
}
</i18n>
