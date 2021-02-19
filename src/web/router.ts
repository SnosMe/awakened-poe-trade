/* eslint-disable @typescript-eslint/promise-function-async */

import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  linkActiveClass: 'active',
  routes: [
    {
      path: '/overlay',
      name: 'overlay',
      component: () => import(/* webpackChunkName: "overlay" */ './overlay/OverlayWindow.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import(/* webpackChunkName: "settings" */ './settings/SettingsWindow.vue'),
      children: [
        {
          path: 'hotkeys',
          name: 'settings.hotkeys',
          component: () => import(/* webpackChunkName: "settings" */ './settings/hotkeys.vue')
        },
        {
          path: 'chat',
          name: 'settings.chat',
          component: () => import(/* webpackChunkName: "settings" */ './settings/chat.vue')
        },
        {
          path: 'general',
          name: 'settings.general',
          component: () => import(/* webpackChunkName: "settings" */ './settings/general.vue')
        },
        {
          path: 'price-check',
          name: 'settings.price-check',
          component: () => import(/* webpackChunkName: "settings" */ './settings/price-check.vue')
        },
        {
          path: 'debug',
          name: 'settings.debug',
          component: () => import(/* webpackChunkName: "settings" */ './settings/debug.vue')
        },
        {
          path: 'maps',
          name: 'settings.maps',
          component: () => import(/* webpackChunkName: "settings" */ './settings/maps.vue')
        }
      ]
    }
  ]
})
