import { createStore } from 'vuex'

export default createStore({
  state: {
    authToken: '',
    isLoggedIn: false,
  },
  actions: {
    setAuthToken({ state }, authToken) {
      state.authToken = authToken;
    },
    setIsLoggedIn({ state }, isLoggedIn) {
      state.isLoggedIn = isLoggedIn;
    },
  },
})
