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

function apiFilesResponseToPhotos(files) {
  return files.map(({ date, sourceId, sourceFileId, metadata }) => ({ 
    date, 
    sourceId,
    sourceFileId, 
    metadata: {
      date: metadata.date,
      video: metadata.video || false,
      width: metadata.width,
      height: metadata.height,
      fileSize: metadata.fileSize,
      fileName: metadata.fileName,
      location: {
        lat: metadata.location.lat,
        long: metadata.location.long,
        altitude: metadata.location.altitude,
      },
      device: metadata.device,
      duration: metadata.duration,
    },
  }))
}

export function error(error) {
  return fetcher.fetch(`${BASE}/client-error`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: `${error.message}\n\nstack:\n${error.stack}`,
    }),
  });
}

export function auth(username, password) {
  return fetcher.fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
}
export async function authVerify() {
  const res = await fetcher.fetch(`${BASE}/auth/verify`, { redirectOn401: false });

  return !res.error;
}

export async function getSources() {
  const res = await fetcher.fetch(`${BASE}/sources`);
  if (res.data) {
    return res.data.map(({ id, alias, path }) => ({ id, alias, path }));
  }
}
export async function getSource(sourceId) {
  const res = await fetcher.fetch(`${BASE}/source/info?id=${sourceId}`);
  if (res.data) {
    return {
      id: res.data.id,
      alias: res.data.alias,
      path: res.data.path,
    }
  } else if (res.error) {
    throw new ApiError(res.error.status);
  }
}
export async function getSourceDirectories(sourceId) {
  const res = await fetcher.fetch(`${BASE}/source/directories?id=${sourceId}`);
  if (res.data) {
    return res.data;
  } else if (res.error) {
    throw new ApiError(res.error.status);
  }
}
export async function getPhotosFromSource(sourceId, start, imageHeight, date, directory) {
  const url = new URL(`${BASE}/source/photos`, window.location.origin);
  url.searchParams.append('id', sourceId);
  url.searchParams.append('start', start);
  url.searchParams.append('imagePreviewHeight', imageHeight);
  url.searchParams.append('imagePreviewArea', window.innerHeight * window.innerWidth);
  if (date) {
    url.searchParams.append('date', date);
  }
  if (directory) {
    url.searchParams.append('directory', directory);
  }
  
  const res = await fetcher.fetch(url.toString());
  if (res.data) {
    const { info, files } = res.data;
    return {
      info,
      photos: apiFilesResponseToPhotos(files),
    }
  } else if (res.error) {
    throw new ApiError(res.error.status);
  }
}

function attachAlbumToken(albumToken) {
  return albumToken ? `&albumToken=${albumToken}` : '';
}
export async function getPhotosFromAlbum(albumId, start, imageHeight, albumToken) {
  const url = new URL(`${BASE}/album/photos`, window.location.origin);
  url.searchParams.append('id', albumId);
  url.searchParams.append('start', start);
  url.searchParams.append('imagePreviewHeight', imageHeight);
  url.searchParams.append('imagePreviewArea', window.innerHeight * window.innerWidth);
  if (albumToken) {
    url.searchParams.append('albumToken', albumToken);
  }

  const res = await fetcher.fetch(url.toString());
  if (res.data) {
    const { info, files } = res.data;
    return {
      info,
      photos: apiFilesResponseToPhotos(files),
    }
  } else if (res.error) {
    throw new ApiError(res.error.status);
  }
}
export async function getAlbums() {
  const res = await fetcher.fetch(`${BASE}/albums`);
  if (res.data) {
    return res.data.map(({ id, name }) => ({ id, name }));
  }
}
export async function getAlbum(albumId, albumToken) {
  const res = await fetcher.fetch(`${BASE}/album/info?id=${albumId}${attachAlbumToken(albumToken)}`);
  if (res.data) {
    return {
      id: res.data.id,
      name: res.data.name,
      token: res.data.token,
    }
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
  const res = await fetcher.fetch(`${BASE}/location?lat=${lat}&long=${long}`);
  if (res.data) {
    return {
      label: res.data.label,
    }
  }
}

export async function pingPhoto(photoUrl) {
  const split = photoUrl.split('?');
  const url = `${split[0]}/ping?${split[1]}`;
  const res = await fetcher.fetch(url);
  if (res.data) {
    return {
      ready: res.data.ready,
    }
  }
}

export function toPhotoUrl(photo, size, albumToken) {
  return `${BASE}/photo?sourceFileId=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}${attachAlbumToken(albumToken)}`;
}
