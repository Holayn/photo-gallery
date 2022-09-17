export const BASE = process.env.NODE_ENV === 'development' ?  'http://localhost:8000/api' : `${process.env.VUE_APP_BASE_URL}/api`;

export const PHOTO_SIZES = {
  LARGE: 'large',
  SMALL: 'small',
  ORIGINAL: 'original',
}

export function toPhotoUrl(photo, size) {
  return `${BASE}/photo?id=${photo.id}&size=${size}`;
}

export async function getPhotos(pageIndex, pageSize) {
  let req;
  if (pageIndex !== null || pageIndex !== undefined) {
    req = fetch(`${BASE}/photos?page=${pageIndex}&pageSize=${Math.ceil(pageSize)}`);
  } else {
    req = fetch(`${BASE}/photos`);
  }
  return await req.then(res => res.json());
}
