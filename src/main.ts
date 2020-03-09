import Vue from 'vue'
import App from './App.vue'
import router from './router'
import TrendChart from 'vue-trend-chart'
import Popper from 'vue-popperjs'
import VueSlider from 'vue-slider-component'
import 'vue-popperjs/dist/vue-popper.css'
import 'vue-slider-component/theme/default.css'

Vue.use(TrendChart)
Vue.component('UiPopper', Popper)
Vue.component('UiSlider', VueSlider)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

process.on('unhandledRejection', error => {
  // TODO: log to Sentry
  // eslint-disable-next-line no-console
  console.error(error)
})
