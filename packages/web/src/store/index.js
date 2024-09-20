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
    isLoggedIn: false,
  },
  actions: {
    setPhotos(context, { photos, sourceId = null, urlParams = '', }) {
      const modPhotos = photos.reduce((acc, photo) => {
        const photoSourceId = photo.sourceId || sourceId;
        const modPhoto = { 
          id: `${photoSourceId}_${photo.sourceFileId}`,
          sourceId: photoSourceId,
          sourceFileId: photo.sourceFileId,
          metadata: photo.metadata,
        }
        modPhoto.urls = {
          [PHOTO_SIZES.LARGE]: toPhotoUrl(modPhoto, PHOTO_SIZES.LARGE) + `&${urlParams}`,
          [PHOTO_SIZES.SMALL]: toPhotoUrl(modPhoto, PHOTO_SIZES.SMALL) + `&${urlParams}`,
          [PHOTO_SIZES.ORIGINAL]: toPhotoUrl(modPhoto, PHOTO_SIZES.ORIGINAL) + `&${urlParams}`,
          [PHOTO_SIZES.THUMB]: toPhotoUrl(modPhoto, PHOTO_SIZES.THUMB) + `&${urlParams}`,
        }
        acc.push(modPhoto);
        return acc;
      }, []);

      context.state.photos = modPhotos;
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
