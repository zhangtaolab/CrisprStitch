import { RouteRecordRaw } from 'vue-router';
import { useWorkerStore } from 'src/stores/worker';
import { Notify } from 'quasar';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IntroductionPage.vue') },
      { path: '/input', component: () => import('pages/InputPage.vue') },
      { path: '/guidance', component: () => import('pages/GuidancePage.vue') },
      {
        path: '/result',
        component: () => import('pages/ResultPage.vue'),
        beforeEnter: (to, from) => {
          if (useWorkerStore().worker) {
            return true;
          } else {
            Notify.create({
              message: 'Please input your data first',
              color: 'warning',
              icon: 'report_problem',
              position: 'top',
              timeout: 2000,
            });
            return false;
          }
        },
      },
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
