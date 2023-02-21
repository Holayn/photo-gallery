import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import Album from './views/Album.vue';
import Sources from './views/Sources.vue';
import Source from './views/Source.vue';
import SourceDirectories from './views/SourceDirectories.vue';
import store from './store'

import Cookies from 'js-cookie'
import { auth, authVerify } from './services/api';
import { setDocumentTitle } from './utils';

const routes = [
  { path: '/', redirect: { name: 'albums' } },
  { name: 'all', path: '/gallery', component: Gallery },
  { name: 'albums', path: '/albums', component: Albums },
  { name: 'album', path: '/album/:albumId', component: Album, props: true },
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
  window.location.reload();
});

router.beforeEach(async (to) => {
  setDocumentTitle(to.name.substring(0, 1).toUpperCase() + to.name.substring(1));
  if (to.name === 'album' && to.query.albumToken) {
    return true;
  }

  if (store.state.isAdmin === null) {
      // Verify token
    if (await authVerify()) {
      store.dispatch('setIsAdmin', true);
      return;
    }
    
    const password = prompt('Password:');
    if (password !== null) {
      const { error } = await auth(password);
      if (error) {
        alert('Authentication failed.');
        return false;
      } else {
        store.dispatch('setIsAdmin', true);
      }
    } else {
      alert('Password is required.');
      window.location.reload();
      return false;
    }
  }
});

createApp(App)
  .use(store)
  .use(router)
  .mount('#app');
