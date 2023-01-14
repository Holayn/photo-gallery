import fetcher from './fetcher';

export const BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.BASE_URL}/api`;

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

export async function getSources() {
  return (await fetcher.fetch(`${BASE}/sources`)).data;
}
export async function getSource(sourceId) {
  return (await fetcher.fetch(`${BASE}/source/info?id=${sourceId}`)).data;
}
export async function getPhotosFromSource(sourceId, start, num) {
  const res = await fetcher.fetch(`${BASE}/source/photos?id=${sourceId}&start=${start}&num=${Math.ceil(num)}`);
  if (res.data) {
    const { info, files } = res.data;
    return {
      info,
      photos: files,
    }
  } else if (res.error) {
    throw new Error(res.error.message);
  }
}

function attachAlbumToken(albumToken) {
  return albumToken ? `&albumToken=${albumToken}` : '';
}
export async function getPhotosFromAlbum(albumId, start, num, albumToken) {
  const res = await fetcher.fetch(`${BASE}/album/photos?id=${albumId}&start=${start}&num=${Math.ceil(num)}${attachAlbumToken(albumToken)}`);
  if (res.data) {
    const { info, files } = res.data;
    return {
      info,
      photos: files,
    }
  } else if (res.error) {
    throw new Error(res.error.message);
  }
}
export async function getAlbums() {
  return (await fetcher.fetch(`${BASE}/albums`)).data;
}
export async function getAlbum(albumId, albumToken) {
  const res = await fetcher.fetch(`${BASE}/album/info?id=${albumId}${attachAlbumToken(albumToken)}`);
  if (res.data) {
    return res.data;
  } else if (res.error) {
    if (albumToken) {
      return {
        error: 'Bad album link.',
      };
    } else {
      return {
        error: res.error.message,
      };
    }
  }
}
export function createAlbum(name, files) {
  return fetcher.fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      files,
    }),
  });
}
export function addToAlbum(albumId, files) {
  return fetcher.fetch(`${BASE}/album`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      files,
    }),
  });
}

export function toPhotoUrl(photo, size, albumToken) {
  return `${BASE}/photo?sourceFileId=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}${attachAlbumToken(albumToken)}`;
}
