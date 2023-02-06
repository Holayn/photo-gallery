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
  Cookies.remove('token');

  // Force the user to re-authenticate.
  window.location.reload();
});

router.beforeEach(async (to) => {
  if (to.name === 'album' && to.query.albumToken) {
    return true;
  }

  if (!store.state.authToken) {
    const existingToken = Cookies.get('token');
    if (existingToken) {
      // Verify token
      if (await authVerify()) {
        store.dispatch('setAuthToken', existingToken);
        store.dispatch('setIsAdmin', true);
        return;
      } else {
        Cookies.remove('token');
      }
    }
    
    const password = prompt('Password:');
    if (password !== null) {
      const { data, error } = await auth(password);
      if (error) {
        alert('Authentication failed.');
        return false;
      } else {
        const { token } = data;
        store.dispatch('setAuthToken', token);
        store.dispatch('setIsAdmin', true);
        Cookies.set('token', token, { 
          sameSite: 'Strict', 
          secure: true
        });
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
