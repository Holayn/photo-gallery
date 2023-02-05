import fetcher from './fetcher';

export const BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.BASE_URL}/api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  ORIGINAL: 'original',
  THUMB: 'thumb',
}

class ApiError extends Error {
  constructor(status, description, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    this.name = "ApiError";
    this.status = status;
    this.description = description;
  }
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
export async function authVerify() {
  const res = await fetcher.fetch(`${BASE}/auth/verify`, { redirectOn401: false });

  return !res.error;
}

export async function getSources() {
  return (await fetcher.fetch(`${BASE}/sources`)).data;
}
export async function getSource(sourceId) {
  const res = await fetcher.fetch(`${BASE}/source/info?id=${sourceId}`);
  if (res.data) {
    return res.data;
  } else if (res.error) {
    throw new ApiError(res.error.status);
  }
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
    throw new ApiError(res.error.status);
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
    throw new ApiError(res.error.status);
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
    throw new ApiError(res.error.status, albumToken ? 'Bad album link' : null);
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

export async function getLocationInfo(lat, long) {
  return (await fetcher.fetch(`${BASE}/location?lat=${lat}&long=${long}`)).data;
}

export function toPhotoUrl(photo, size, albumToken) {
  return `${BASE}/photo?sourceFileId=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}${attachAlbumToken(albumToken)}`;
}
