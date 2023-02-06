const AlbumService = require('./album');
const SourceService = require('./source');

function getAlbumFiles(albumId, start, num) {
  const files = AlbumService.getAlbumFiles(albumId, start, num);

  return {
    info: {
      hasMorePhotos: files.length >= num,
    },
    files: files.map(f => {
      const { date, sourceId, sourceFileId, metadata } = SourceService.getSourceFile(f.sourceId, f.sourceFileId);
      return {
        date, 
        sourceId, 
        sourceFileId, 
        metadata,
      }
    }),
  }
}

function getSourceFiles(sourceId, start, num, directory) {
  const files = SourceService.findFilesFrom(sourceId, start, num, directory);

  return {
    info: {
      hasMorePhotos: files.length >= num,
    },
    files: files.map(({ date, sourceId, sourceFileId, metadata }) => {
      return {
        date, 
        sourceId, 
        sourceFileId, 
        metadata,
      }
    }),
  }
}

function getDirectories(sourceId) {
  return SourceService.getDirectories(sourceId);
}

module.exports = {
  getAlbumFiles,
  getDirectories,
  getSourceFiles,
}