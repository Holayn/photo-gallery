export const BASE = process.env.NODE_ENV === 'development' ? 'http://192.168.0.133:8000/api' : '/api';

export async function fetchPhotos(albumParam) {
  const { album } = await (await fetch(`${BASE}/config?album=${albumParam}`)).json();
  const { albums } = album;
  const content = albums[0].files;
  return content;
}

export async function fetchGalleryTitle(albumParam) {
  const { title } = await (await fetch(`${BASE}/title?album=${albumParam}`)).json();
  return title;
}