import { PHOTO_SIZES } from './services/api';
import fetcher from './services/fetcher';

const IMAGE_HEIGHT = 200;
const IMAGE_HEIGHT_MOBILE = 80;
const AVERAGE_IMAGE_WIDTH = 300;
const IMAGE_WIDTH_MOBILE = 80;

export const DIMENSIONS = {
  IMAGE_HEIGHT,
  IMAGE_HEIGHT_MOBILE,
  AVERAGE_IMAGE_WIDTH,
  IMAGE_WIDTH_MOBILE,
}

const BASE_TITLE = 'Photos';
export function setDocumentTitle(title) {
  document.title = `${title} - ${BASE_TITLE}`;
}

export function isMobileScreen() {
  return window.innerHeight < 800 && window.innerWidth < 500;
}

export function getGalleryPhotoSize() {
  return isMobileScreen() ? PHOTO_SIZES.THUMB : PHOTO_SIZES.SMALL;
}

export function estimateNumImagesFitOnPage() {
  const width = isMobileScreen() ? IMAGE_WIDTH_MOBILE : AVERAGE_IMAGE_WIDTH;
  const height = isMobileScreen() ? IMAGE_HEIGHT_MOBILE : IMAGE_HEIGHT;
  const { innerWidth, innerHeight } = window;
  const rows = Math.ceil((innerHeight) / height);
  const imagesPerRow = Math.ceil(innerWidth / width);

  return rows * imagesPerRow;
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
