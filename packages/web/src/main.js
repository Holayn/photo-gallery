import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue'
import Gallery from './views/Gallery.vue';
import Albums from './views/Albums.vue';
import Album from './views/Album.vue';
import Sources from './views/Sources.vue';
import Source from './views/Source.vue';
import store from './store'

import Cookies from 'js-cookie'
import { auth } from './services/api';

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
});

router.beforeEach(async (to) => {
  if (to.name === 'album' && to.query.albumToken) {
    return true;
  }

  if (!store.state.authToken) {
    const password = prompt('Password:');
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
  }
});

createApp(App)
  .use(store)
  .use(router)
  .mount('#app');
