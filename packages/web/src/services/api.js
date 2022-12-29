import fetcher from './fetcher';

export const BASE = process.env.NODE_ENV === 'development' ? `/api` : `${process.env.VUE_APP_BASE_URL || ''}/api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  ORIGINAL: 'original',
  THUMB: 'thumb',
}

export function auth(password) {
  return fetcher.fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password,
    }),
  });
}

export function getSources() {
  return fetcher.fetch(`${BASE}/sources`);
}
export function getSource(sourceId) {
  return fetcher.fetch(`${BASE}/source/info?id=${sourceId}`);
}
export function getPhotosFromSource(sourceId, start, num) {
  return fetcher.fetch(`${BASE}/source/photos?id=${sourceId}&start=${start}&num=${Math.ceil(num)}`)
}

function attachAlbumToken(albumToken) {
  return albumToken ? `&albumToken=${albumToken}` : '';
}
export function getPhotosFromAlbum(albumId, start, num, albumToken) {
  return fetcher.fetch(`${BASE}/album/photos?id=${albumId}&start=${start}&num=${Math.ceil(num)}${attachAlbumToken(albumToken)}`)
}
export function getAlbums() {
  return fetcher.fetch(`${BASE}/albums`);
}
export function getAlbum(albumId, albumToken) {
  return fetcher.fetch(`${BASE}/album/info?id=${albumId}${attachAlbumToken(albumToken)}`);
}
export function createAlbum(name, photos) {
  return fetcher.fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      files: photos,
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

export function toPhotoUrl(photo, size, albumToken) {
  return `${BASE}/photo?id=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}${attachAlbumToken(albumToken)}`;
}
