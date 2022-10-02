<template>
  <div class="max-w-md p-2">
    <div class="mb-4">
      <div class="flex-1 mb-1">{{ t('Language') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="flex gap-x-4">
        <ui-radio v-model="language" value="en">English</ui-radio>
        <ui-radio v-model="language" value="ru">Русский</ui-radio>
        <ui-radio v-model="language" value="cmn-Hant">正體中文</ui-radio>
        <ui-radio v-model="language" value="zh_CN">简体中文</ui-radio>
      </div>
    </div>
    <div class="mb-4" v-if="language === 'cmn-Hant'">
      <div class="flex-1 mb-1">{{ t('Realm') }}</div>
      <div class="flex gap-x-4">
        <ui-radio v-model="realm" value="pc-ggg">{{ t('International') }}</ui-radio>
        <ui-radio v-model="realm" value="pc-garena">{{ t('Garena') }}</ui-radio>
      </div>
    </div>
    <div class="mb-4" v-if="language === 'zh_CN'">
      <div class="flex-1 mb-1">{{ t('Realm') }}</div>
      <div class="flex gap-x-4">
        <ui-radio v-model="realm" value="pc-ggg">{{ t('International') }}</ui-radio>
        <ui-radio v-model="realm" value="pc-tencent">{{ t('tencent') }}</ui-radio>
        <div class="flex gap-x-1" v-show="realm === 'pc-tencent'">
          <div :class="{ 'text-red-500': poesessid.length !== 32 }">{{ t('POESESSID') }}</div>
          <span><input v-model="poesessid" class="rounded bg-gray-900 px-2 flex-1"></span>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Font size') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4 flex">
        <input v-model.number="fontSize" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
        <span class="ml-1">px</span>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Auto-download updates') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="disableUpdateDownload" :value="false" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="disableUpdateDownload" :value="true" class="mr-4">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('PoE log file') }}</div>
      <div class="mb-4 flex">
        <input v-model.trim="clientLog"
          class="rounded-l bg-gray-900 px-1 block w-full font-sans" placeholder="???/Grinding Gear Games/Path of Exile/logs/Client.txt">
        <input type="file" id="file-client-log" class="hidden" accept=".txt" @input="handleLogFile">
        <label class="text-gray-400 bg-gray-900 px-2 rounded-r ml-px cursor-pointer" for="file-client-log">{{ t('Browse') }}</label>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('PoE config file') }}</div>
      <div class="mb-4 flex">
        <input v-model.trim="gameConfig"
          class="rounded-l bg-gray-900 px-1 block w-full font-sans" placeholder="???/My Games/Path of Exile/production_Config.ini">
        <input type="file" id="file-client-config" class="hidden" accept=".ini" @input="handleGameConfigFile">
        <label class="text-gray-400 bg-gray-900 px-2 rounded-r ml-px cursor-pointer" for="file-client-config">{{ t('Browse') }}</label>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Background, when APT window is clickable') }}</div>
      <div class="mb-1 flex">
        <input v-model="overlayBackground" class="rounded bg-gray-900 px-1 block w-48 mb-1 mr-4 font-poe text-center" />
        <ui-radio v-model="overlayBackground" value="rgba(255, 255, 255, 0)">{{ t('Transparent') }}</ui-radio>
      </div>
      <div class="mb-4" v-if="overlayBackground !== 'rgba(255, 255, 255, 0)'">
        <ui-radio v-model="overlayBackgroundExclusive" :value="true" class="mr-4">{{ t('Show for Overlay and Price Check') }}</ui-radio>
        <ui-radio v-model="overlayBackgroundExclusive" :value="false">{{ t('Show only for Overlay') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Clicking on background focuses game') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="overlayBackgroundClose" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="overlayBackgroundClose" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Restore clipboard') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="restoreClipboard" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="restoreClipboard" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { configModelValue, configProp } from './utils'

export default defineComponent({
  name: 'General',
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

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
          if (value !== 'cmn-Hant') {
            props.config.realm = 'pc-ggg'
          }
        }
      }),
      realm: configModelValue(() => props.config, 'realm'),
      poesessid: configModelValue(() => props.config, 'poesessid'),
      disableUpdateDownload: configModelValue(() => props.config, 'disableUpdateDownload'),
      handleLogFile (e: Event) {
        props.config.clientLog = ((e as InputEvent).target as HTMLInputElement).files![0].path
      },
      handleGameConfigFile (e: Event) {
        props.config.gameConfig = ((e as InputEvent).target as HTMLInputElement).files![0].path
      },
      restoreClipboard: configModelValue(() => props.config, 'restoreClipboard')
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Font size": "Размер шрифта",
    "Background, when APT window is clickable": "Фон, когда окно APT кликабельно",
    "Transparent": "Прозрачный",
    "Show for Overlay and Price Check": "Показывать для оверлея и прайс-чека",
    "Show only for Overlay": "Показывать только для оверлея",
    "Clicking on background focuses game": "Нажатие по фону активирует окно игры",
    "Language": "Язык",
    "PoE log file": "Файл логов PoE",
    "PoE config file": "Файл настроек PoE",
    "Browse": "Выбрать",
    "Auto-download updates": "Автозагрузка обновлений",
    "Restore clipboard": "Восстанавливать буфер обмена"
  },
  "zh_CN": {
    "Font size": "字体大小",
    "Background, when APT window is clickable": "背景, 当APT窗口可点击时",
    "Transparent": "透明度",
    "Show for Overlay and Price Check": "在浮动层及价格查询显示",
    "Show only for Overlay": "仅在浮动层显示",
    "Clicking on background focuses game": "点击背景回到游戏",
    "Language": "语言",
    "Realm": "服务器",
    "International": "国际服",
    "PoE log file": "PoE日志文件",
    "PoE config file": "PoE配置文件",
    "Browse": "浏览",
    "Auto-download updates": "自动下载更新",
    "Restore clipboard": "恢复剪贴板"
  },
  "cmn-Hant": {
    "Font size": "字體大小",
    "Background, when APT window is clickable": "背景, 當APT窗口可點擊時",
    "Transparent": "透明度",
    "Show for Overlay and Price Check": "在浮動層及價格查詢顯示",
    "Show only for Overlay": "僅在浮動層顯示",
    "Clicking on background focuses game": "點擊背景回到遊戲",
    "Language": "語言",
    "Realm": "分流",
    "International": "國際",
    "PoE log file": "PoE日誌文件",
    "PoE config file": "PoE配置文件",
    "Browse": "瀏覽",
    "Auto-download updates": "自動下載更新",
    "Restore clipboard": "恢復剪貼板"
  }
}
</i18n>
