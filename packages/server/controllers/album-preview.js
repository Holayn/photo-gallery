const fs = require('fs');
const path = require('path');
const escapeHtml = require('escape-html');

const config = require('../services/config');
const AlbumService = require('../services/album');
const { AlbumDAO } = require('../services/db');
const AuthController = require('./auth');

const INDEX_HTML_PATH = path.join(__dirname, '../../web/dist/index.html');

let cachedTemplate = null;
function getTemplate() {
  if (!cachedTemplate || config.isDevelopment) {
    cachedTemplate = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  }
  return cachedTemplate;
}

module.exports = {
  // Injects OG meta tags for the shared album's cover photo when a valid token
  // is present, so link previews (iMessage, Discord, etc.) render before the SPA loads.
  render(req, res) {
    const { albumId } = req.params;
    const { token } = req.query;

    const album = AlbumDAO.getByIdAlias(albumId);

    if (!AuthController.isValidAlbumToken(album, token)) {
      res.sendFile(INDEX_HTML_PATH);
      return;
    }

    const coverFile = AlbumService.getCoverFile(album.id);
    const photoCount = AlbumService.getFileCount(album.id);

    const title = album.name || 'Unknown Album';
    const description = `${photoCount} photo${photoCount === 1 ? '' : 's'}`;
    const pageUrl = `${config.baseUrl}/album/${albumId}?token=${token}`;
    const imageUrl = coverFile
      ? `${coverFile.urls.view.small}&id=${albumId}&token=${token}`
      : null;

    const metaTags = [
      `<title>${escapeHtml(title)}</title>`,
      '<meta property="og:type" content="website">',
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:description" content="${escapeHtml(description)}">`,
      `<meta property="og:url" content="${escapeHtml(pageUrl)}">`,
      imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : '',
    ].filter(Boolean).join('\n    ');

    res.send(getTemplate().replace('<!-- SSR_META -->', metaTags));
  },
};
