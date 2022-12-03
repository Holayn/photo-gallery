export const BASE = process.env.NODE_ENV === 'development' ?  `http://${window.location.hostname}:8000/api` : `${process.env.VUE_APP_BASE_URL || ''}/api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  ORIGINAL: 'original',
  THUMB: 'thumb',
}

export function toPhotoUrl(photo, size) {
  return `${BASE}/photo?id=${photo.id}&size=${size}`;
}

export function getPhotos(albumId, start, num) {
  if (albumId) {
    return fetch(`${BASE}/album?id=${albumId}&start=${start}&num=${Math.ceil(num)}`)
    .then(res => res.json());
  } else {
    return fetch(`${BASE}/photos?start=${start}&num=${Math.ceil(num)}`)
    .then(res => res.json());
  }
}

export function getAlbums() {
  return fetch(`${BASE}/albums`).then(res => res.json());
}

export function getAlbum(albumId) {
  return fetch(`${BASE}/album/info?id=${albumId}`).then(res => res.json());
}

export function createAlbum(name, photoIds) {
  return fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      files: photoIds,
    }),
  });
}

export function addToAlbum(albumId, photoIds) {
  return fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      files: photoIds,
    }),
  });
}
