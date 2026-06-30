const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'dashboard', path: '', component: () => import('pages/Dashboard.vue') },
      { name: 'bettas', path: 'bettas', component: () => import('pages/Bettas.vue') },
      { name: 'betta-detail', path: 'bettas/:id', component: () => import('pages/BettaDetail.vue') },
      { name: 'reproducciones', path: 'reproducciones', component: () => import('pages/Reproducciones.vue') },
      { name: 'genealogia', path: 'genealogia', component: () => import('pages/Genealogia.vue') },
      { name: 'estadisticas', path: 'estadisticas', component: () => import('pages/Estadisticas.vue') },
      { name: 'finanzas', path: 'finanzas', component: () => import('pages/Finanzas.vue') },
      { name: 'configuracion', path: 'configuracion', component: () => import('pages/Configuracion.vue') },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
