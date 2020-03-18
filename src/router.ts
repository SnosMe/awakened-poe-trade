import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  linkActiveClass: 'active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "price-check" */ './views/Home.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import(/* webpackChunkName: "settings" */ './components/settings/SettingsWindow.vue'),
      children: [
        {
          path: 'hotkeys',
          name: 'settings.hotkeys',
          component: () => import(/* webpackChunkName: "settings" */ './components/settings/hotkeys.vue')
        },
        {
          path: 'general',
          name: 'settings.general',
          component: () => import(/* webpackChunkName: "settings" */ './components/settings/general.vue')
        },
        {
          path: 'debug',
          name: 'settings.debug',
          component: () => import(/* webpackChunkName: "settings" */ './components/settings/debug.vue')
        }
      ]
    }
  ]
})
