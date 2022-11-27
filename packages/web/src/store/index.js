import { createStore } from 'vuex'

export default createStore({
  state: {
    albums: [],
    photos: [],
    lightbox: {
      photoIndex: 0,
    },
  },
  getters: {
    album(state) {
      return (albumId) => {
        return state.albums.find(a => a.id === albumId);
      }
    },
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
    setAlbums(context, payload) {
      context.albums = payload;
    }
  },
  modules: {
  }
})
