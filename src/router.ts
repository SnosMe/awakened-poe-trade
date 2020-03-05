import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Settings from './components/settings/SettingsWindow.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    }
  ]
})
