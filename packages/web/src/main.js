import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import Album from './views/Album.vue';
import Sources from './views/Sources.vue';
import Source from './views/Source.vue';
import store from './store'

const routes = [
  { path: '/', redirect: { name: 'albums' } },
  { name: 'all', path: '/gallery', component: Gallery },
  { name: 'albums', path: '/albums', component: Albums },
  { name: 'album', path: '/album/:albumId', component: Album, props: true },
  { name: 'sources', path: '/sources', component: Sources },
  { name: 'source', path: '/source/:sourceId', component: Source, props: true },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

createApp(App)
  .use(store)
  .use(router)
  .mount('#app');
