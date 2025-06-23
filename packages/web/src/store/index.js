import { createStore } from 'vuex'

export default createStore({
  state: {
    photos: [],
    lightbox: {
      photoIndex: 0,
    },

    authToken: '',
    isLoggedIn: false,
  },
  actions: {
    setPhotos(context, { photos }) {
      context.state.photos = photos;
    },
    clearPhotos(context) {
      context.state.photos = [];
    },

    setAuthToken({ state }, authToken) {
      state.authToken = authToken;
    },
    setIsLoggedIn({ state }, isLoggedIn) {
      state.isLoggedIn = isLoggedIn;
    },
  },
})
