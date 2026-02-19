import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // WARN: PUBLIC ROUTES
  {
    path: '/',
    component: () => import('layouts/GuestLayout.vue'),
    children: [
      { path: '', component: () => import('pages/public/LoginPage.vue') },
      { path: 'signup', component: () => import('pages/public/SignupPage.vue') },
      { path: 'password', component: () => import('pages/public/password/SetPage.vue') },
      { path: 'password/forgot', component: () => import('pages/public/password/ForgotPage.vue') },
    ],
  },

  // INFO: AUTHENTICATED ROUTES
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '/pings', component: () => import('pages/pings/IndexPage.vue') },
      { path: '/profile', component: () => import('pages/profile/IndexPage.vue') },
      { path: '/tokens', component: () => import('pages/tokens/IndexPage.vue') },
      { path: '/trackers', component: () => import('pages/trackers/IndexPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
