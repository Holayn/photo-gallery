export const BASE = process.env.NODE_ENV === 'development' ?  `http://${window.location.hostname}:8000/api` : `${process.env.VUE_APP_BASE_URL || ''}/api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  ORIGINAL: 'original',
  THUMB: 'thumb',
}

export function toPhotoUrl(photo, size) {
  return `${BASE}/photo?id=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}`;
}

export function getSources() {
  return fetch(`${BASE}/sources`).then(res => res.json());
}
export function getSource(sourceId) {
  return fetch(`${BASE}/source/info?id=${sourceId}`).then(res => res.json());
}

export async function getPhotosFromSource(sourceId, start, num) {
  const response = await fetch(`${BASE}/source/photos?id=${sourceId}&start=${start}&num=${Math.ceil(num)}`)
  .then(res => res.json());
  response.photos.forEach(p => {
    p.sourceId = sourceId
    p.id = `${sourceId}_${p.sourceFileId}`;
  });
  return response;
}

export async function getPhotosFromAlbum(albumId, start, num) {
  const response = await fetch(`${BASE}/album/photos?id=${albumId}&start=${start}&num=${Math.ceil(num)}`)
  .then(res => res.json());
  response.photos.forEach(p => {
    p.id = `${p.sourceId}_${p.sourceFileId}`;
  });
  return response;
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

export function addToAlbum(albumId, photos) {
  return fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      files: photos,
    }),
  }).then(res => {
    if (res.status === 500) {
      throw new Error('Server Error');
    }
  });
}
