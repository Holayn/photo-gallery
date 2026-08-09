import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import Album from './views/Album.vue';
import Sources from './views/Sources.vue';
import Source from './views/Source.vue';
import SourceDirectories from './views/SourceDirectories.vue';
import Memories from './views/Memories.vue';
import { createPinia } from 'pinia'
import { useAuthStore } from './store'

import { authVerify, error } from './services/api';
import { setDocumentTitle, redirectToLogin } from './utils';

import './style.css';

// Rewrite old hash-style links (e.g. /#/album/xyz?token=abc) from the pre-history-mode
// router into real paths, since the server can't see the hash fragment to redirect itself.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

const pinia = createPinia();

const routes = [
  { name: 'home', path: '/', redirect: () => {
    return { name: 'albums' };
  } },
  { name: 'all', path: '/gallery', component: Gallery },
  { name: 'albums', path: '/albums', component: Albums },
  { name: 'album', path: '/album/:albumId', component: Album, props: route => ({
    ...route.params,
    showLightbox: route.query.showLightbox === 'true',
  })},
  { name: 'sources', path: '/sources', component: Sources },
  { name: 'memories', path: '/memories', component: Memories, props: route => ({
    ...route.params,
    showLightbox: route.query.showLightbox === 'true',
  })},
  { name: 'source', path: '/source/:sourceId/:directory?', component: Source, props: route => ({
    ...route.params,
    showLightbox: route.query.showLightbox === 'true',
  })},
  { name: 'sourceDirectories', path: '/source/:sourceId/directories', component: SourceDirectories, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

window.addEventListener('unauthorized', () => {
  // Force the user to re-authenticate.
  redirectToLogin();
});

router.beforeEach(async (to) => {
  if (to.name === 'album' && to.query.token) {
    return true;
  }

  const authStore = useAuthStore();
  if (!authStore.isLoggedIn) {
    // Verify token
    if (await authVerify()) {
      authStore.setIsLoggedIn(true);
    } else {
      redirectToLogin();
      return false;
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
  .use(pinia)
  .use(router)
  .mount('#app');

