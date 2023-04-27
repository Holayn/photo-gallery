import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import Album from './views/Album.vue';
import Login from './views/Login.vue';
import Sources from './views/Sources.vue';
import Source from './views/Source.vue';
import SourceDirectories from './views/SourceDirectories.vue';
import store from './store'

import { authVerify, error } from './services/api';
import { setDocumentTitle } from './utils';

const routes = [
  { name: 'home', path: '/', redirect: { name: 'albums' } },
  { name: 'all', path: '/gallery', component: Gallery },
  { name: 'albums', path: '/albums', component: Albums },
  { name: 'album', path: '/album/:albumId', component: Album, props: true },
  { name: 'login', path: '/login', component: Login },
  { name: 'sources', path: '/sources', component: Sources },
  { name: 'source', path: '/source/:sourceId/:directory?', component: Source, props: true },
  { name: 'sourceDirectories', path: '/source/:sourceId/directories', component: SourceDirectories, props: true },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

window.addEventListener('unauthorized', () => {
  // Force the user to re-authenticate.
  router.push({ name: 'login' });
});

router.beforeEach(async (to) => {
  setDocumentTitle(to.name.substring(0, 1).toUpperCase() + to.name.substring(1));

  if (to.name === 'album' && to.query.albumToken) {
    return true;
  }
  if (to.name === 'login') {
    return true;
  }

  if (store.state.isAdmin === null) {
      // Verify token
    if (await authVerify()) {
      store.dispatch('setIsAdmin', true);
    } else {
      router.push({ name: 'login' });
    }
  }
});

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  error(err);
  throw err;
}

app
  .use(store)
  .use(router)
  .mount('#app');

