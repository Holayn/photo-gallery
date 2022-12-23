import fetcher from './fetcher';

export const BASE = process.env.NODE_ENV === 'development' ?  `http://${window.location.hostname}:8000/api` : `${process.env.VUE_APP_BASE_URL || ''}/api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  ORIGINAL: 'original',
  THUMB: 'thumb',
}

export function toPhotoUrl(photo, size, token) {
  return `${BASE}/photo?id=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}&token=${token}`;
}

export function getSources() {
  return fetcher.fetch(`${BASE}/sources`);
}
export function getSource(sourceId) {
  return fetcher.fetch(`${BASE}/source/info?id=${sourceId}`);
}

export async function getPhotosFromSource(sourceId, start, num) {
  const response = await fetcher.fetch(`${BASE}/source/photos?id=${sourceId}&start=${start}&num=${Math.ceil(num)}`)
  response.photos.forEach(p => {
    p.sourceId = sourceId
    p.id = `${sourceId}_${p.sourceFileId}`;
  });
  return response;
}

export async function getPhotosFromAlbum(albumId, start, num, token) {
  const response = await fetcher.fetch(`${BASE}/album/photos?id=${albumId}&start=${start}&num=${Math.ceil(num)}&token=${token}`)
  response.photos.forEach(p => {
    p.id = `${p.sourceId}_${p.sourceFileId}`;
  });
  return response;
}

export function getAlbums() {
  return fetcher.fetch(`${BASE}/albums`);
}

export function getAlbum(albumId, token) {
  return fetcher.fetch(`${BASE}/album/info?id=${albumId}&token=${token}`);
}

export function createAlbum(name, photoIds) {
  return fetcher.fetch(`${BASE}/album`, {
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
  return fetcher.fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      files: photos,
    }),
  });
}
