import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(__APP_ROUTER_BASE__),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/index.html',
      name: 'theme-direct-home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/instance/:id',
      name: 'instance-detail',
      component: () => import('@/views/InstanceDetail.vue'),
    },
    {
      path: '/theme-settings/ping',
      name: 'theme-ping-settings',
      component: () => import('@/views/ThemePingSettings.vue'),
    },
  ],
})

export default router
