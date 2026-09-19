import Photo from '../model/photo';
import fetcher from './fetcher';

export const BASE = import.meta.env.DEV ? '/api' : `${import.meta.env.BASE_URL}api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  THUMB: 'thumb',
  FULL: 'full',
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
  }).catch(() => {});
}

export async function authVerify() {
  try {
    await fetcher.fetch(`${BASE}/auth/verify`, { redirectOn401: false });
    return true;
  } catch (e) {
    return false;
  }
}
export function logout() {
  return fetcher.fetch(`${BASE}/auth/logout`, { method: 'post' });
}

export function getSources() {
  return fetcher.fetch(`${BASE}/sources`);
}
export function getSource(sourceId) {
  return fetcher.fetch(`${BASE}/source/info?id=${sourceId}`);
}
export function createSource(sourceFilesPath, alias, exclude) {
  return fetcher.fetch(`${BASE}/source/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceFilesPath, alias, exclude }),
  });
}
export function subscribeToSourceCreation(sourceId) {
  return new EventSource(`${BASE}/source/create/stream?id=${sourceId}`);
}
export function processSource(sourceId) {
  return fetcher.fetch(`${BASE}/source/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: sourceId }),
  });
}
export function convertFile(sourceId, sourceFileId) {
  return fetcher.fetch(`${BASE}/source/file/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceId, sourceFileId }),
  });
}
export function getFilesStatus(files) {
  return fetcher.fetch(`${BASE}/source/files/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });
}
export function setSourceContinuous(sourceId, continuous) {
  return fetcher.fetch(`${BASE}/source/continuous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: sourceId, continuous }),
  });
}
export function getSourcesProcessing() {
  return fetcher.fetch(`${BASE}/sources/processing`);
}
export async function getSourceCover(sourceId) {
  const { files } = await fetcher.fetch(`${BASE}/source/cover?id=${sourceId}`);
  return {
    photos: files.map(f => new Photo(f)),
  };
}
export function getSourceDirectories(sourceId) {
  return fetcher.fetch(`${BASE}/source/directories?id=${sourceId}`);
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

  const { files } = await fetcher.fetch(url.toString());
  return {
    photos: files.map(f => new Photo({
      ...f,
      sourceId,
    })),
  };
}

export async function getPhotosFromAlbum(albumId, albumToken) {
  const url = new URL(`${BASE}/album/photos`, window.location.origin);
  url.searchParams.append('id', albumId);
  if (albumToken) {
    url.searchParams.append('token', albumToken);
  }

  const { files } = await fetcher.fetch(url.toString());
  return {
    photos: files.map(f => new Photo(f)),
  };
}
export function getAlbums() {
  return fetcher.fetch(`${BASE}/albums`);
}
export function getRecentlyUpdatedCollections(limit) {
  const url = new URL(`${BASE}/recently-updated`, window.location.origin);
  if (limit) {
    url.searchParams.append('limit', limit);
  }

  return fetcher.fetch(url.toString());
}
export async function getAlbum(albumId, albumToken) {
  const { id, name, token } = await fetcher.fetch(`${BASE}/album/info?id=${albumId}${albumToken ? `&token=${albumToken}` : ''}`);
  return { id, name, token };
}
export async function getAlbumCover(albumId) {
  const { files } = await fetcher.fetch(`${BASE}/album/cover?id=${albumId}`);
  return {
    photos: files.map(f => new Photo(f)),
  };
}
export function deleteAlbum(albumId) {
  return fetcher.fetch(`${BASE}/album/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: albumId }),
  });
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
  const { token } = await fetcher.fetch(`${BASE}/album/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: album.id,
    }),
  });
  return token;
}

export async function getPhotoOfDay() {
  const photo = await fetcher.fetch(`${BASE}/photo/of-day`);
  return photo ? new Photo(photo) : null;
}

export async function sharePhoto(photo) {
  const { shareUrl } = await fetcher.fetch(`${BASE}/photo/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourceId: photo.sourceId,
      sourceFileId: photo.sourceFileId,
    }),
  });
  return shareUrl;
}

export function getMemories(year) {
  const url = new URL(`${BASE}/memories`, window.location.origin);
  if (year) {
    url.searchParams.append('year', year);
  }

  return fetcher.fetch(url.toString());
}

export function getMemoriesCovers() {
  return fetcher.fetch(`${BASE}/memories/covers`);
}

export function getUsers() {
  return fetcher.fetch(`${BASE}/users`);
}

export function getSourceUsers(sourceId) {
  return fetcher.fetch(`${BASE}/source/users?id=${sourceId}`);
}

export function addSourceUser(sourceId, userId) {
  return fetcher.fetch(`${BASE}/source/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceId, userId }),
  });
}

export function removeSourceUser(sourceId, userId) {
  return fetcher.fetch(`${BASE}/source/users/delete`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceId, userId }),
  });
}

export function getExploreNext() {
  return fetcher.fetch(`${BASE}/explore/next`);
}

export function clearExploreHistory() {
  return fetcher.fetch(`${BASE}/explore/history/clear`, { method: 'POST' });
}
