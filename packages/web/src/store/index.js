import { createStore } from 'vuex'

import { toPhotoUrl, PHOTO_SIZES } from '../services/api';

export default createStore({
  state: {
    albumToken: '',

    photos: [],
    lightbox: {
      photoIndex: 0,
    },

    authToken: '',
    isAdmin: false,
  },
  actions: {
    addPhotos(context, { photos, sourceId }) {
      const modPhotos = photos.reduce((acc, photo) => {
        const modPhoto = { 
          ...photo,
          sourceId: photo.sourceId || sourceId,
          id: `${photo.sourceId || sourceId}_${photo.sourceFileId}`,
        }
        modPhoto.urls = {
          [PHOTO_SIZES.LARGE]: toPhotoUrl(modPhoto, PHOTO_SIZES.LARGE, context.state.albumToken),
          [PHOTO_SIZES.SMALL]: toPhotoUrl(modPhoto, PHOTO_SIZES.SMALL, context.state.albumToken),
          [PHOTO_SIZES.ORIGINAL]: toPhotoUrl(modPhoto, PHOTO_SIZES.ORIGINAL, context.state.albumToken),
          [PHOTO_SIZES.THUMB]: toPhotoUrl(modPhoto, PHOTO_SIZES.THUMB, context.state.albumToken),
        }
        acc.push(modPhoto);
        return acc;
      }, []);

      context.state.photos.push(...modPhotos);
    },
    clearPhotos(context) {
      context.state.photos = [];
    },
    setAlbumToken(context, albumToken) {
      context.state.albumToken = albumToken;
    },

    setAuthToken({ state }, authToken) {
      state.authToken = authToken;
    },
    setIsAdmin({ state }, isAdmin) {
      state.isAdmin = isAdmin;
    },
  },
})
