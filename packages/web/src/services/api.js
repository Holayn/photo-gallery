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
  return files.map(({ date, sourceId, sourceFileId, metadata, albums }) => ({ 
    date, 
    sourceId,
    sourceFileId, 
    metadata: {
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
    albums,
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
export async function auth2FA(code) {
  return fetcher.fetch(`${BASE}/auth/2fa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      twoFACode: code,
    }),
  });
}
export function logout() {
  return fetcher.fetch(`${BASE}/auth/logout`, { method: 'post' });
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
export async function getSourceCover(sourceId) {
  const res = await fetcher.fetch(`${BASE}/source/cover?id=${sourceId}`);
  if (res.data) {
    const { files } = res.data;
    return {
      photos: apiFilesResponseToPhotos(files),
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
export async function getPhotosFromSource(sourceId, date, directory) {
  const url = new URL(`${BASE}/source/photos`, window.location.origin);
  url.searchParams.append('id', sourceId);
  if (date) {
    url.searchParams.append('date', date);
  }
  if (directory) {
    url.searchParams.append('directory', directory);
  }
  
  const res = await fetcher.fetch(url.toString());
  if (res.data) {
    const { files } = res.data;
    return {
      photos: apiFilesResponseToPhotos(files),
    }
  } else if (res.error) {
    throw new ApiError(res.error.status);
  }
}

export async function getPhotosFromAlbum(albumId, albumToken) {
  const url = new URL(`${BASE}/album/photos`, window.location.origin);
  url.searchParams.append('id', albumId);
  if (albumToken) {
    url.searchParams.append('albumToken', albumToken);
  }

  const res = await fetcher.fetch(url.toString());
  if (res.data) {
    const { files } = res.data;
    return {
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
  const res = await fetcher.fetch(`${BASE}/album/info?id=${albumId}${albumToken ? `&albumToken=${albumToken}` : ''}`);
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
export async function getAlbumCover(albumId) {
  const res = await fetcher.fetch(`${BASE}/album/cover?id=${albumId}`);
  if (res.data) {
    const { files } = res.data;
    return {
      photos: apiFilesResponseToPhotos(files),
    }
  } else if (res.error) {
    throw new ApiError(res.error.status);
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
export function deleteFromAlbum(albumId, files) {
  return fetcher.fetch(`${BASE}/album/delete-files`, {
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
export async function shareAlbum(album) {
  const res = await fetcher.fetch(`${BASE}/album/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: album.id,
    }),
  });

  return res.data.token;
}

export async function getLocationInfo(lat, long) {
  const res = await fetcher.fetch(`${BASE}/location?lat=${lat}&long=${long}`);
  if (res.data) {
    return {
      label: res.data.label,
    }
  }
}

export function toPhotoUrl(photo, size) {
  return `${BASE}/photo?sourceFileId=${photo.sourceFileId}&sourceId=${photo.sourceId}&size=${size}`;
}

export function toPhotoDownloadUrl(photo) {
  return `${BASE}/photo/download?sourceFileId=${photo.sourceFileId}&sourceId=${photo.sourceId}`;
}
