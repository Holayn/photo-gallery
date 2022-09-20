import { PHOTO_SIZES } from './services/api';

export function isMobileScreen() {
  return window.innerHeight < 800 && window.innerWidth < 500;
}

export function getGalleryPhotoSize() {
  return isMobileScreen() ? PHOTO_SIZES.THUMB : PHOTO_SIZES.SMALL;
}
