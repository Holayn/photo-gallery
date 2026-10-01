const ProcessorSource = require('../processor-source/processor-source');
const { SourceDAO, GalleryFileDAO, AlbumFileDAO, AlbumDAO, AlbumAssignmentDAO } = require('../db');
const SourceFile = require('./source-file');

function getProcessorSource(sourceId) {
  const source = SourceDAO.getById(sourceId);
  return source ? new ProcessorSource(source) : null;
}

// Albums the user may see a file listed under: not deleted, and assigned to them.
// Returns a map of gallery file id -> [{ name, idAlias }].
function findAssignedAlbumsByFileId(galleryFiles, userId) {
  const albumFiles = AlbumFileDAO.findByFileIds(galleryFiles.map((gf) => gf.id));
  const albumsById = new Map(
    AlbumDAO.findByIds([...new Set(albumFiles.map((af) => af.albumId))]).map((a) => [a.id, a])
  );
  const assignedAlbumIds = new Set(AlbumAssignmentDAO.findByUserId(userId).map((s) => s.albumId));

  const albumsByFileId = new Map();
  albumFiles.forEach(({ fileId, albumId }) => {
    const album = albumsById.get(albumId);
    if (!album || album.hidden || !assignedAlbumIds.has(albumId)) {
      return;
    }
    if (!albumsByFileId.has(fileId)) {
      albumsByFileId.set(fileId, []);
    }
    albumsByFileId.get(fileId).push({ name: album.name, idAlias: album.idAlias });
  });

  return albumsByFileId;
}

// Album membership is only loaded on request since it's per-user and costs extra queries.
function load(sourceId, processorFiles, { includeAlbums = false, userId, urlParams } = {}) {
  const galleryFiles = GalleryFileDAO.findBySourceFileIds(sourceId, processorFiles.map((f) => f.id));
  const galleryFileBySourceFileId = new Map(galleryFiles.map((gf) => [gf.sourceFileId, gf]));
  const albumsByFileId = includeAlbums ? findAssignedAlbumsByFileId(galleryFiles, userId) : null;

  return processorFiles.map((processorFile) => {
    const galleryFile = galleryFileBySourceFileId.get(processorFile.id) ?? null;
    if (galleryFile) {
      return new SourceFile({
        sourceId,
        processorFile,
        galleryFile,
        albums: albumsByFileId ? (galleryFile && albumsByFileId.get(galleryFile.id)) || [] : null,
        urlParams,
      });
    }

    return null;
  }).filter(i => !!i);
}

module.exports = {
  findFiles(sourceId, startDateRange, directory) {
    const processorSource = getProcessorSource(sourceId);
    if (!processorSource) {
      return [];
    }

    return load(sourceId, processorSource.findFiles(startDateRange, directory));
  },

  findFilesWithAlbums(sourceId, startDateRange, directory, userId) {
    const processorSource = getProcessorSource(sourceId);
    if (!processorSource) {
      return [];
    }

    return load(sourceId, processorSource.findFiles(startDateRange, directory), { includeAlbums: true, userId });
  },

  findCoverFiles(sourceId) {
    const processorSource = getProcessorSource(sourceId);
    if (!processorSource) {
      return [];
    }

    return load(sourceId, processorSource.findRandom(4));
  },

  getFileCount(sourceId) {
    return getProcessorSource(sourceId).count();
  },

  getFile(sourceId, sourceFileId) {
    const processorFile = getProcessorSource(sourceId)?.getFile(sourceFileId);
    return processorFile ? load(sourceId, [processorFile])[0] : null;
  },

  // Batched getFile() for refs of { sourceId, sourceFileId }, possibly spanning sources.
  // Results keep the order of `refs`; files that no longer exist are omitted.
  getFiles(refs, options) {
    const sourceFileIdsBySourceId = new Map();
    refs.forEach(({ sourceId, sourceFileId }) => {
      if (!sourceFileIdsBySourceId.has(sourceId)) {
        sourceFileIdsBySourceId.set(sourceId, []);
      }
      sourceFileIdsBySourceId.get(sourceId).push(sourceFileId);
    });

    const loaded = new Map();
    sourceFileIdsBySourceId.forEach((sourceFileIds, sourceId) => {
      const processorSource = getProcessorSource(sourceId);
      if (!processorSource) {
        return;
      }

      const processorFiles = sourceFileIds.map((id) => processorSource.getFile(id)).filter(Boolean);
      load(sourceId, processorFiles, options).forEach((file) => loaded.set(`${sourceId}:${file.sourceFileId}`, file));
    });

    return refs.map(({ sourceId, sourceFileId }) => loaded.get(`${sourceId}:${sourceFileId}`)).filter(Boolean);
  },

  // Cheap, batched status check to poll while one or more videos are preview-only/converting.
  // Files that no longer exist in their source are omitted.
  getFilesStatus(files) {
    return this.getFiles(files).map((file) => file.toStatus());
  },

  getProcessedFilePath(sourceId, id, size) {
    return getProcessorSource(sourceId).getProcessedFilePath(id, size);
  },

  getOriginalPath(sourceId, id) {
    return getProcessorSource(sourceId).getOriginalPath(id);
  },
};
