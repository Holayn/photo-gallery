const dayjs = require('dayjs');

const { GalleryFileDAO, UserSourceDAO } = require('./db');
const SourceService = require('./source');

// Simple string hash so consecutive days don't land on sequential offsets.
function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = Math.abs((hash * 31 + str.charCodeAt(i)) % Number.MAX_SAFE_INTEGER);
  }
  return hash;
}

function getPhotoOfDay(user) {
  const sourceIds = UserSourceDAO.findByUserId(user.id).map((us) => us.sourceId);
  const seed = hashSeed(dayjs().format('YYYY-MM-DD'));

  const found = GalleryFileDAO.findRandomForSeed(seed, sourceIds);
  if (!found) {
    return null;
  }

  return SourceService.getFile(found.sourceId, found.sourceFileId);
}

module.exports = {
  getPhotoOfDay,
};
