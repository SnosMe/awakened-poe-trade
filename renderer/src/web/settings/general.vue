<template>
  <div class="max-w-md p-2">
    <div class="mb-4">
      <div class="flex-1 mb-1">{{ t(':language') }}</div>
      <div class="flex gap-x-4">
        <ui-radio v-model="language" value="en">English</ui-radio>
        <ui-radio v-model="language" value="ru">Русский</ui-radio>
        <ui-radio v-model="language" value="cmn-Hant">正體中文</ui-radio>
      </div>
    </div>
    <div class="mb-4" v-if="language === 'cmn-Hant'">
      <div class="flex-1 mb-1">{{ t('realm') }}</div>
      <div class="flex gap-x-4">
        <ui-radio v-model="realm" value="pc-ggg">{{ t('realm_intl') }}</ui-radio>
        <ui-radio v-model="realm" value="pc-garena">{{ t('Garena') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':font_size') }}</div>
      <div class="mb-4 flex">
        <input v-model.number="fontSize" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
        <span class="ml-1">px</span>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('updates.auto_download') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="disableUpdateDownload" :value="false" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="disableUpdateDownload" :value="true" class="mr-4">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':poe_log_file') }}</div>
      <div class="mb-4 flex">
        <input v-model.trim="clientLog"
          class="rounded bg-gray-900 px-1 block w-full font-sans" placeholder="...?/Grinding Gear Games/Path of Exile/logs/Client.txt">
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':poe_cfg_file') }}</div>
      <div class="mb-4 flex">
        <input v-model.trim="gameConfig"
          class="rounded bg-gray-900 px-1 block w-full font-sans" placeholder="...?/My Games/Path of Exile/production_Config.ini">
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':overlay_bg') }}</div>
      <div class="mb-1 flex">
        <input v-model="overlayBackground" class="rounded bg-gray-900 px-1 block w-48 mb-1 mr-4 font-poe text-center" />
        <ui-radio v-model="overlayBackground" value="rgba(255, 255, 255, 0)">{{ t(':overlay_bg_none') }}</ui-radio>
      </div>
      <div class="mb-4" v-if="overlayBackground !== 'rgba(255, 255, 255, 0)'">
        <ui-radio v-model="overlayBackgroundExclusive" :value="true" class="mr-4">{{ t(':overlay_bg_exclusive') }}</ui-radio>
        <ui-radio v-model="overlayBackgroundExclusive" :value="false">{{ t(':overlay_bg_itself') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':overlay_bg_focus_game') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="overlayBackgroundClose" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="overlayBackgroundClose" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':restore_clipboard') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="restoreClipboard" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="restoreClipboard" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':show_overlay_ready') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="showAttachNotification" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="showAttachNotification" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18nNs } from '@/web/i18n'
import { configModelValue, configProp } from './utils'
import { AppConfig } from '@/web/Config'

export default defineComponent({
  name: 'settings.general',
  props: configProp(),
  setup (props) {
    const { t } = useI18nNs('settings')

    return {
      t,
      fontSize: configModelValue(() => props.config, 'fontSize'),
      overlayBackgroundClose: configModelValue(() => props.config, 'overlayBackgroundClose'),
      overlayBackground: configModelValue(() => props.config, 'overlayBackground'),
      overlayBackgroundExclusive: configModelValue(() => props.config, 'overlayBackgroundExclusive'),
      clientLog: configModelValue(() => props.config, 'clientLog'),
      gameConfig: configModelValue(() => props.config, 'gameConfig'),
      language: computed<typeof props.config.language>({
        get () { return props.config.language },
        set (value) {
          props.config.language = value
          AppConfig().language = value
          if (value !== 'cmn-Hant') {
            props.config.realm = 'pc-ggg'
          }
        }
      }),
      realm: configModelValue(() => props.config, 'realm'),
      disableUpdateDownload: configModelValue(() => props.config, 'disableUpdateDownload'),
      restoreClipboard: configModelValue(() => props.config, 'restoreClipboard'),
      showAttachNotification: configModelValue(() => props.config, 'showAttachNotification')
    }
  }
})
</script>
