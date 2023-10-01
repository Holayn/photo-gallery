const AlbumService = require("./album");
const SourceService = require("./source");

function getAlbumFiles(albumId, start, num) {
  const files = AlbumService.getAlbumFiles(albumId, start, num);

  return {
    info: {
      hasMorePhotos: files.length >= num,
    },
    files: files
      .map((f) => ({ ...SourceService.getSourceFile(f.sourceId, f.sourceFileId), sourceId: f.sourceId }))
      .filter((f) => !!f.sourceFileId)
      .map(({ date, sourceId, sourceFileId = null, metadata }) => {
        return {
          date,
          sourceId,
          sourceFileId,
          metadata,
        }
      }),
  }
}

function getSourceFiles(sourceId, start, num, startDateRange, directory) {
  const files = SourceService.findFilesFrom(
    sourceId,
    start,
    num,
    startDateRange,
    directory
  );

  return {
    info: {
      hasMorePhotos: files.length >= num,
    },
    files: files.map(
      ({ date, sourceFileId = null, metadata }) => ({
        date,
        sourceFileId,
        metadata,
      })
    ),
  };
}

function getDirectories(sourceId) {
  return SourceService.getDirectories(sourceId);
}

module.exports = {
  getAlbumFiles,
  getDirectories,
  getSourceFiles,
};
