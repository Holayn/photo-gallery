const AlbumService = require('./album');
const SourceService = require('./source');

const RANGE_QUERY_SIZE = 50;

function getAlbumFiles(albumId, start, imagePreviewHeight, imagePreviewArea) {
  if (!imagePreviewArea || !imagePreviewHeight) {
    return null;
  }

  let usedArea = 0;
  const retFiles = [];
  let rangeStart = start;
  let hasMorePhotos = false;

  while (usedArea < imagePreviewArea) {
    const files = AlbumService.getAlbumFiles(
      albumId,
      rangeStart,
      RANGE_QUERY_SIZE
    )
      .map((f) => ({
        ...SourceService.getFile(f.sourceId, f.sourceFileId),
        sourceId: f.sourceId,
      }))
      .filter((f) => !!f.sourceFileId);

    for (const file of files) {
      retFiles.push(file);

      const { width: fileWidth, height: fileHeight } = file.metadata;

      if (!fileWidth || !fileHeight) {
        throw new Error('File is missing width/height metadata.');
      }

      const ratioFactor = fileHeight / imagePreviewHeight;
      const adjustedWidth = fileWidth / ratioFactor;
      usedArea += adjustedWidth * imagePreviewHeight;

      if (usedArea >= imagePreviewArea) {
        break;
      }
    }

    rangeStart += RANGE_QUERY_SIZE;

    hasMorePhotos = files.length >= RANGE_QUERY_SIZE;

    if (!hasMorePhotos) {
      break;
    }
  }

  return {
    info: {
      hasMorePhotos,
    },
    files: retFiles.map(
      ({ date, sourceId, sourceFileId = null, metadata }) => ({
        date,
        sourceId,
        sourceFileId,
        metadata,
      })
    ),
  };
}

function getSourceFiles(
  sourceId,
  start,
  imagePreviewHeight,
  imagePreviewArea,
  startDateRange,
  directory
) {
  if (!imagePreviewArea || !imagePreviewHeight) {
    return null;
  }

  let usedArea = 0;
  const retFiles = [];
  let rangeStart = start;
  let hasMorePhotos = false;

  while (usedArea < imagePreviewArea) {
    const files = SourceService.findFiles(
      sourceId,
      rangeStart,
      RANGE_QUERY_SIZE,
      startDateRange,
      directory
    );

    for (const file of files) {
      retFiles.push(file);

      const { width: fileWidth, height: fileHeight } = file.metadata;

      if (!fileWidth || !fileHeight) {
        throw new Error('File is missing width/height metadata.');
      }

      const ratioFactor = fileHeight / imagePreviewHeight;
      const adjustedWidth = fileWidth / ratioFactor;
      usedArea += adjustedWidth * imagePreviewHeight;

      if (usedArea >= imagePreviewArea) {
        break;
      }
    }

    rangeStart += RANGE_QUERY_SIZE;

    hasMorePhotos = files.length >= RANGE_QUERY_SIZE;

    if (!hasMorePhotos) {
      break;
    }
  }

  return {
    info: {
      hasMorePhotos,
    },
    files: retFiles.map(({ date, sourceFileId = null, metadata }) => ({
      date,
      sourceFileId,
      metadata,
    })),
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
