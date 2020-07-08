import Vue from 'vue'
import App from './web/App.vue'
import router from './web/router'
import i18n from './web/i18n'
import TrendChart from 'vue-trend-chart'
import Popper from 'vue-popperjs'
import VueSlider from 'vue-slider-component'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import 'vue-popperjs/dist/vue-popper.css'
import 'vue-slider-component/theme/default.css'
import './web/ui'

Vue.use(TrendChart)
Vue.use(VueVirtualScroller)
Vue.component('UiPopper', Popper)
Vue.component('UiSlider', VueSlider)

Vue.config.productionTip = false

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount('#app')

process.on('unhandledRejection', error => {
  // TODO: log to Sentry
  // eslint-disable-next-line no-console
  console.error(error)
})
