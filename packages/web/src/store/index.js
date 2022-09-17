import { createStore } from 'vuex'

export default createStore({
  state: {
    photos: [],
    lightbox: {
      photoIndex: 0,
    },
  },
  mutations: {
  },
  actions: {
    addPhotos(context, payload) {
      context.state.photos.push(...payload);
    },
  },
  modules: {
  }
})
