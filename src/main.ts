import Vue from 'vue'
import App from './App.vue'
import router from './router'
import TrendChart from 'vue-trend-chart'
import Popper from 'vue-popperjs'
import 'vue-popperjs/dist/vue-popper.css'

Vue.use(TrendChart)
Vue.component('UiPopper', Popper)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

process.on('unhandledRejection', error => {
  // TODO: log to Sentry
  console.error(error)
})
