import { createStore } from 'vuex'

export default createStore({
  state: {
    photos: [],
    lightbox: {
      photoIndex: 0,
    },
    token: '',
  },
  mutations: {
  },
  actions: {
    addPhotos(context, payload) {
      context.state.photos.push(...payload);
    },
    clearPhotos(context) {
      context.state.photos = [];
    },
    setToken(context, token) {
      context.state.token = token;
    },
  },
  modules: {
  }
})
