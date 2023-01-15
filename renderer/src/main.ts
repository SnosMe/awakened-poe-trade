import { createApp, watch } from 'vue'
import App from './web/App.vue'
import * as I18n from './web/i18n'
import * as Data from './assets/data'
import uiComponents from './web/ui'
import { initConfig, AppConfig } from './web/Config'

;(async function () {
  await initConfig()
  const i18nPlugin = await I18n.init(AppConfig().language)
  await Data.init(AppConfig().language)

  watch(() => AppConfig().language, async () => {
    await Data.loadForLang(AppConfig().language)
    await I18n.loadLang(AppConfig().language)
  })

  createApp(App)
    .use(i18nPlugin)
    .use(uiComponents)
    .mount('#app')
})()
