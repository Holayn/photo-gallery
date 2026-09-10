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

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    photoFrameMode: localStorage.getItem('photoFrameMode') === 'true',
  }),
  actions: {
    setPhotoFrameMode(photoFrameMode) {
      this.photoFrameMode = photoFrameMode;
      localStorage.setItem('photoFrameMode', photoFrameMode);
    },
  },
})
