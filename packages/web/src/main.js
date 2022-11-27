import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import store from './store'

const routes = [
  { path: '/', redirect: { name: 'albums' } },
  { name: 'gallery', path: '/gallery/:albumId', component: Gallery, props: true },
  { name: 'albums', path: '/albums', component: Albums },
];

const router = createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: createWebHashHistory(),
  routes, // short for `routes: routes`
})

createApp(App)
  .use(store)
  .use(router)
  .mount('#app');
