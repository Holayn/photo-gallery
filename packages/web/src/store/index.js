import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authToken: '',
    isLoggedIn: false,
  }),
  actions: {
    setAuthToken(authToken) {
      this.authToken = authToken;
    },
    setIsLoggedIn(isLoggedIn) {
      this.isLoggedIn = isLoggedIn;
    },
  },
})
