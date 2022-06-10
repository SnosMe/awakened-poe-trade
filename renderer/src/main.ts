import { createApp } from 'vue'
import App from './web/App.vue'
import i18n from './web/i18n'
import uiComponents from './web/ui'
import 'animate.css/animate.css'

;(async function () {
  createApp(App)
    .use(await i18n())
    .use(uiComponents)
    .mount('#app')
})()
