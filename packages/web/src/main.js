import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import Album from './views/Album.vue';
import Login from './views/Login.vue';
import TwoFA from './views/TwoFA.vue';
import Sources from './views/Sources.vue';
import Source from './views/Source.vue';
import SourceDirectories from './views/SourceDirectories.vue';
import store from './store'

import { authVerify, error } from './services/api';
import { setDocumentTitle } from './utils';

import './style.css';

const routes = [
  { name: 'home', path: '/', redirect: () => {
    if (store.state.isLoggedIn === null) {
      return { name: 'login' };
    }
    return { name: 'albums' };
  } },
  { name: 'all', path: '/gallery', component: Gallery },
  { name: 'albums', path: '/albums', component: Albums },
  { name: 'album', path: '/album/:albumId', component: Album, props: route => ({
    ...route.params,
    showLightbox: route.query.showLightbox === 'true',
  })},
  { name: 'login', path: '/login', component: Login, props: route => route.query },
  { name: '2fa', path: '/2fa', component: TwoFA, props: route => route.query },
  { name: 'sources', path: '/sources', component: Sources },
  { name: 'source', path: '/source/:sourceId/:directory?', component: Source, props: route => ({
    ...route.params,
    showLightbox: route.query.showLightbox === 'true',
  })},
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
  if (to.name === 'album' && to.query.albumToken) {
    return true;
  }
  if (to.name === 'login' || to.name === '2fa') {
    return true;
  }

  if (!store.state.isLoggedIn) {
      // Verify token
    if (await authVerify()) {
      store.dispatch('setIsLoggedIn', true);
    } else {
      router.push({ 
        name: 'login', 
        query: { 
          next: to.path,
        },
      });
    }
  }
});

router.afterEach((to, from) => {
  if (to.name !== from.name) {
    // Sometimes there can be route changes to the same route (e.g., a route query parameter change).
    setDocumentTitle(to.name.substring(0, 1).toUpperCase() + to.name.substring(1));
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

