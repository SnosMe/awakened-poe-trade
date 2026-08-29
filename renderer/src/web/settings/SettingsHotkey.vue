<template>
  <div class="flex">
    <label class="flex-1">{{ t(schema.translationKey) }} <span v-if="schema.required" :class="$style.required">*</span></label>
    <HotkeyInput v-if="'value' in schema.config"
      v-model="schema.config.value" class="w-48"
      :required="schema.required" />
    <div v-else :class="[$style.splitKey, { [$style.unset]: !schema.config.modKey.value }]" class="w-48">
      <button
        :class="{ [$style.active]: schema.config.modKey.value === 'Ctrl' }"
        @click="schema.config.modKey.value = 'Ctrl'">Ctrl</button>
      <button
        :class="{ [$style.active]: schema.config.modKey.value === 'Alt' }"
        @click="schema.config.modKey.value = 'Alt'">Alt</button>
      <span>+</span>
      <HotkeyInput v-model="schema.config.nonModKey.value" class="w-20"
        :required="schema.required"
        no-mod-keys />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import HotkeyInput from '../settings/HotkeyInput.vue'

export interface HotkeySchema {
  readonly translationKey: string
  readonly config:
    | { value: string | null }
    | {
      readonly modKey: { value: string | null }
      readonly nonModKey: { value: string | null }
    }
  readonly required?: boolean
}

defineProps<{
  schema: HotkeySchema
}>()

const { t } = useI18n()
</script>

<style lang="postcss" module>
.required {
  font-size: theme('fontSize.lg');
  line-height: 1;
  color: theme('colors.red.500');
}

.splitKey {
  display: flex;
  gap: theme('spacing.1');
  color: theme('colors.gray.100');

  &.unset {
    color: theme('colors.red.400');
  }

  & > button {
    border-radius: theme('borderRadius.DEFAULT');
    padding: 0 theme('spacing.1');
    background: theme('colors.gray.900');
    border: theme('borderWidth.DEFAULT') solid transparent;
    line-height: 1;

    &.active {
      border-color: currentColor;
    }
  }

  & > span {
    flex: 1;
    text-align: center;
  }
}
</style>
