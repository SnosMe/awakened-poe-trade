<template>
  <div :class="$style['row']" >
    <div class="flex-1 flex items-center px-2 overflow-hidden gap-x-1 whitespace-nowrap">
      <span v-if="matcher.tag === StatTag.Outdated" :class="[$style['tag'], $style['tag-outdated']]">{{ t('map.mods.outdated') }}</span>
      <span v-if="matcher.tag === StatTag.HeistExclusive" :class="[$style['tag'], $style['tag-heist']]">{{ t('map.mods.heist') }}</span>
      <span v-if="matcher.tag === StatTag.UberMapExclusive" :class="[$style['tag'], $style['tag-uber']]">{{ t('map.mods.uber') }}</span>
      <span class="truncate">{{ matcher.matchStr }}</span>
    </div>
    <div class="flex items-baseline gap-x-4" :class="{ [$style['controls-auto-hide']]: !removable() }">
      <ui-radio v-model="decision" value="w" class="p-1" />
      <ui-radio v-model="decision" value="d" class="p-1" />
      <ui-radio v-model="decision" value="g" class="p-1" />
      <button v-if="removable()" @click="remove"
        class="flex items-center mx-1 py-1" :class="{ 'text-red-400': matcher.tag === StatTag.Outdated }">
        <i class="w-4" :class="(matcher.tag === StatTag.Outdated) ? 'fas fa-trash-alt' : 'fas fa-times'"></i>
      </button>
      <div v-else class="w-6" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import UiRadio from '@/web/ui/UiRadio.vue'
import { StatMatcher, StatTag, decisionHasColor, decisionCreate, MapCheckStat } from './common.js'

export default defineComponent({
  emits: [],
  components: { UiRadio },
  props: {
    matcher: {
      type: Object as PropType<StatMatcher>,
      required: true
    },
    selectedStats: {
      type: Array as PropType<MapCheckStat[]>,
      required: true
    },
    profile: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    const entry = computed(() => props.selectedStats
      .find(({ matcher }) => matcher === props.matcher.matchStr))

    const decision = computed<string>({
      get () {
        if (!entry.value) return '-'
        return entry.value.decision[props.profile - 1]
      },
      set (value) {
        const newSet = decisionCreate(value, props.profile, entry.value?.decision)
        if (!entry.value) {
          props.selectedStats.push({
            matcher: props.matcher.matchStr,
            decision: newSet
          })
        } else {
          entry.value.decision = newSet
        }
      }
    })

    function remove () {
      if (entry.value) {
        decision.value = '---'
      }
    }

    return {
      t,
      entry,
      decision,
      removable () {
        return decisionHasColor(entry.value?.decision ?? '---', props.profile)
      },
      remove,
      StatTag
    }
  }
})
</script>

<style lang="postcss" module>
.row {
  display: flex;
  align-items: center;
  width: 100%;
  @apply h-8;
  cursor: default;
  line-height: 1;
}

.row:hover {
  @apply bg-gray-700;
}

.row:not(:hover) .controls-auto-hide {
  display: none !important;
}

.tag {
  @apply px-1;
  @apply rounded;
  line-height: 1;
}
.tag-heist {
  @apply bg-red-800;
}
.tag-uber {
  @apply bg-purple-600;
}
.tag-outdated {
  @apply bg-red-400 text-black;
}
</style>
