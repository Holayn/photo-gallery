export const BASE = process.env.NODE_ENV === 'development' ?  'http://localhost:8000/api' : `${process.env.VUE_APP_BASE_URL}api`;

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