import { PHOTO_SIZES } from './services/api';
import fetcher from './services/fetcher';

export const getImageHeight = () => {
  return isMobileScreen() ? window.innerWidth / 5 - 5 : Math.min(200, window.innerWidth / 5);
}

const BASE_TITLE = 'Photos';
export function setDocumentTitle(title) {
  document.title = `${title} - ${BASE_TITLE}`;
}

export function isMobileScreen() {
  return window.innerWidth < 500;
}

export function getGalleryPhotoSize() {
  return isMobileScreen() ? PHOTO_SIZES.THUMB : PHOTO_SIZES.SMALL;
}

export async function loadPhotoToBase64(url) {
  const imageUrlToBase64 = async url => {
    const blob = await fetcher.fetch(url, { blob: true });
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = function(){ resolve(this.result) };
        reader.readAsDataURL(blob);
      } catch(e) {
        reject(e);
      }
    });
  };

  return new Promise((resolve) => {
    imageUrlToBase64(url).then(data => {
      console.debug(`Loaded ${url}`);
      resolve(data);
    });
  });
}
