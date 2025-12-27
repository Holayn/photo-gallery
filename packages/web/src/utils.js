import { PHOTO_SIZES } from './services/api';
import fetcher from './services/fetcher';

export function getMobileGalleryImageHeight() {
  return window.innerWidth / 5 - 5;
}

export const getGalleryImageHeight = () => {
  return isMobileScreen() ? getMobileGalleryImageHeight() : Math.min(200, window.innerWidth / 5);
}

export function setDocumentTitle(title) {
  document.title = `${title}`;
}

export function isMobileScreen() {
  return window.innerWidth < 500;
}

export function getFetchedGalleryPhotoSize() {
  return isMobileScreen() ? PHOTO_SIZES.THUMB : PHOTO_SIZES.SMALL;
}

export function debounce(func, delay, { leading } = {}) {
  let timerId

  return (...args) => {
    if (!timerId && leading) {
      func(...args)
    }
    clearTimeout(timerId)

    timerId = setTimeout(() => func(...args), delay)
  }
}

export function isElementFullyInView(element, options = { threshold: 0 }) {
  return new Promise((resolve, reject) => {
    if (!('IntersectionObserver' in window)) {
      reject(new Error('Intersection Observer API not supported'));
      return;
    }

    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio < 1) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    };

    const observer = new IntersectionObserver(callback, {
      ...options,
      root: null, // Use the viewport
    });

    observer.observe(element);

    // Cleanup after the observation is done
    observer.unobserve(element);
  });
}
