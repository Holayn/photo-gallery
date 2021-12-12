export const BASE = 'https://192.168.0.133/photos';

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