const SourceFileService = require('./source-file');
const PushNotification = require('./push-notification');
const logger = require('./logger');
const { generateUniqueRandomNumbers, generateRandomString } = require('../util/random');

const { AlbumDAO, AlbumFileDAO, GalleryFileDAO, SourceDAO, AlbumAssignmentDAO, transaction } = require('./db');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const AlbumFileDto = require('../dto/album-file');
const GalleryFile = require('../model/gallery-file');

module.exports = {
  createAlbum(name, files = {}, userId = null) {
    return transaction(() => {
      const albumId = AlbumDAO.insert(new Album({ name, createdBy: userId }));
      AlbumAssignmentDAO.insert({ userId, albumId });
      this.addToAlbum(albumId, files, userId);
      return albumId;
    });
  },

  addToAlbum(albumId, files = {}, actingUserId = null) {
    transaction(() => {
      // Make all added files have the same createdAt time, so that they appear to have been added at the same time rather than milliseconds apart.
      const createdAt = new Date().getTime();
      let addedCount = 0;

      Object.keys(files).forEach((file) => {
        const f = files[file];
        const existingFile = GalleryFileDAO.getBySource(
          f.sourceId,
          f.sourceFileId
        );
        if (existingFile) {
          const existingAlbumFile = AlbumFileDAO.findAnyByAlbumIdFileId(
            albumId,
            existingFile.id
          );
          if (!existingAlbumFile) {
            AlbumFileDAO.insert(
              new AlbumFile({ albumId, fileId: existingFile.id, createdAt })
            );
            addedCount += 1;
          } else if (existingAlbumFile.hidden) {
            AlbumFileDAO.unhide(albumId, existingFile.id, createdAt);
          }
        } else {
          const sourceFile = SourceFileService.getFile(f.sourceId, f.sourceFileId);
          const newFileId = GalleryFileDAO.insert(
            new GalleryFile({
              date: sourceFile.date,
              sourceFileId: f.sourceFileId,
              sourceId: f.sourceId,
            })
          );
          AlbumFileDAO.insert(new AlbumFile({ albumId, fileId: newFileId }));
          addedCount += 1;
        }
      });

      if (addedCount > 0) {
        AlbumDAO.touch(albumId, createdAt);

        const album = AlbumDAO.getById(albumId);
        const recipientIds = AlbumAssignmentDAO.findUsersByAlbumId(albumId)
          .map((u) => u.id)
          .filter((id) => id !== actingUserId);

        if (recipientIds.length) {
          PushNotification.notifyUsers(recipientIds, {
            title: 'New Photos',
            body: `${addedCount} new ${addedCount > 1 ? 'photos were' : 'photo was'} added to ${album.name}.`,
            url: `/album/${album.idAlias}`,
          }).catch((err) => logger.error(`Failed to send push notification for album #${albumId}`, err));
        }
      }
    });
  },

  removeFromAlbum(albumId, files = {}) {
    transaction(() => {
      let changed = false;

      Object.keys(files).forEach((file) => {
        const f = files[file];
        const existingFile = GalleryFileDAO.getBySource(
          f.sourceId,
          f.sourceFileId
        );
        if (existingFile) {
          const existsInAlbum = AlbumFileDAO.getByAlbumIdFileId(
            albumId,
            existingFile.id
          );
          if (existsInAlbum) {
            AlbumFileDAO.hide(albumId, existingFile.id);
            changed = true;
          }
        }
      });

      if (changed) {
        AlbumDAO.touch(albumId);
      }
    });
  },

  getAlbumFiles(id, albumIdAlias, token) {
    const albumFilesByFileId = new Map(AlbumFileDAO.findByAlbumId(id).map((af) => [af.fileId, af]));
    const galleryFiles = GalleryFileDAO.findByIds([...albumFilesByFileId.keys()]);
    const sourceFilesByGalleryFileId = new Map(
      SourceFileService.getFiles(galleryFiles, {
        urlParams: `&id=${albumIdAlias}${token ? `&token=${token}` : ''}`,
      }).map((sf) => [sf.galleryFileId, sf])
    );
    const aliasBySourceId = new Map();

    return galleryFiles.map((galleryFile) => {
      if (!aliasBySourceId.has(galleryFile.sourceId)) {
        aliasBySourceId.set(galleryFile.sourceId, SourceDAO.getById(galleryFile.sourceId).alias);
      }

      return new AlbumFileDto({
        albumFile: albumFilesByFileId.get(galleryFile.id),
        galleryFile,
        sourceFile: sourceFilesByGalleryFileId.get(galleryFile.id) ?? null,
        sourceAlias: aliasBySourceId.get(galleryFile.sourceId),
      });
    });
  },

  getFileCount(albumId) {
    return AlbumFileDAO.findByAlbumId(albumId).length;
  },

  getCoverFile(albumId) {
    const albumFiles = AlbumFileDAO.findByAlbumId(albumId);
    if (!albumFiles.length) {
      return null;
    }

    // Deterministic pick (earliest added) so the preview image stays stable across re-fetches,
    // unlike findCoverFiles() below which is intentionally randomized for in-app display.
    const [{ fileId }] = albumFiles.sort((a, b) => a.createdAt - b.createdAt);
    const file = GalleryFileDAO.findByIds([fileId])[0];
    if (!file) {
      return null;
    }

    return SourceFileService.getFile(file.sourceId, file.sourceFileId);
  },

  findCoverFiles(albumId) {
    const albumFiles = AlbumFileDAO.findByAlbumId(albumId);

    const files = generateUniqueRandomNumbers(albumFiles.length, 4).map(index => albumFiles[index]);
    const fileIds = files.map(f => f.fileId);

    return SourceFileService.getFiles(GalleryFileDAO.findByIds(fileIds));
  },

  deleteAlbum(albumId) {
    AlbumDAO.hide(albumId);
  },

  generateAlbumToken(id) {
    const album = AlbumDAO.getById(id);
    if (album.token) {
      return album.token;
    }
    album.token = generateRandomString(72);
    AlbumDAO.update(album);
    return album.token;
  },
};
