import { PHOTO_SIZES } from './services/api';

export function setDocumentTitle(title) {
  document.title = `${title}`;
}

export function getSmallTileModeImageHeight() {
  return (window.innerWidth / 5) - 10;
}

export const getGalleryImageHeight = () => {
  return isSmallTileMode() ? getSmallTileModeImageHeight() : Math.min(150, window.innerWidth / 5)
}

export function isSmallScreen() {
  return window.innerWidth < 500;
}

export function isSmallTileMode() {
  return isSmallScreen();
}

export function getGalleryPhotoSize() {
  if (isSmallTileMode()) {
    return PHOTO_SIZES.THUMB;
  }
  return PHOTO_SIZES.SMALL;
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
