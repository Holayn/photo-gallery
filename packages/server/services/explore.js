const { GalleryFileDAO, UserExploreHistoryDAO, UserSourceDAO } = require('./db');
const SourceService = require('./source');

function getNext(user) {
  const sourceIds = UserSourceDAO.findByUserId(user.id).map((us) => us.sourceId);

  const found = GalleryFileDAO.findRandomUnexplored(user.id, sourceIds);
  if (!found) {
    return null;
  }

  UserExploreHistoryDAO.insert({
    userId: user.id,
    sourceId: found.sourceId,
    sourceFileId: found.sourceFileId,
  });

  return SourceService.getFile(found.sourceId, found.sourceFileId);
}

module.exports = {
  getNext,
}
