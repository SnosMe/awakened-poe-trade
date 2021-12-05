import { createApp } from 'vue'
import App from './web/App.vue'
import i18n from './web/i18n'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import uiComponents from './web/ui'
import 'animate.css/animate.css'

;(async function () {
  createApp(App)
    .use(await i18n())
    .component('UiSlider', VueSlider)
    .use(uiComponents)
    .mount('#app')
})()

process.on('unhandledRejection', error => {
  // TODO: log to Sentry
  // eslint-disable-next-line no-console
  console.error(error)
})
