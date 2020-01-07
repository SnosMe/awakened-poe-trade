import Vue from 'vue'
import App from './App.vue'
import router from './router'
import TrendChart from 'vue-trend-chart'

Vue.use(TrendChart)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

process.on('unhandledRejection', error => {
  // TODO: log to Sentry
  console.error(error)
})
