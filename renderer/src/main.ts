import { createApp } from 'vue'
import App from './web/App.vue'
import i18n from './web/i18n'
import uiComponents from './web/ui'
import { initConfig } from './web/Config'
import { initData } from './assets/data'

;(async function () {
  await initConfig()
  await initData()

  createApp(App)
    .use(await i18n())
    .use(uiComponents)
    .mount('#app')
})()
