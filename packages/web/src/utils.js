import { PHOTO_SIZES } from './services/api';
import fetcher from './services/fetcher';

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

export function removeURLParameter(url, parameter) {
  //prefer to use l.search if you have a location/link object
  var urlparts = url.split('?');   
  if (urlparts.length >= 2) {

      var prefix = encodeURIComponent(parameter) + '=';
      var pars = urlparts[1].split(/[&;]/g);

      //reverse iteration as may be destructive
      for (var i = pars.length; i-- > 0;) {    
          //idiom for string.startsWith
          if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
              pars.splice(i, 1);
          }
      }

      return urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
  }
  return url;
}