import { BASE } from './services/fetch';

export function getUrl(path, album) {
  return `${BASE}/${album}/${path}`;
}
