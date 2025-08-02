const crypto = require('crypto');

const SourceService = require('./source');

const { AlbumDAO, AlbumFileDAO, GalleryFileDAO, transaction } = require('./db');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const GalleryFile = require('../model/gallery-file');

module.exports = {
  createAlbum(name, files = {}) {
    return transaction(() => {
      const albumId = AlbumDAO.insert(new Album({ name }));
      this.addToAlbum(albumId, files);
      return albumId;
    });
  },

  addToAlbum(albumId, files = {}) {
    transaction(() => {
      // Make all added files have the same createdAt time, so that they appear to have been added at the same time rather than milliseconds apart.
      const createdAt = new Date().getTime();

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
          if (!existsInAlbum) {
            AlbumFileDAO.insert(
              new AlbumFile({ albumId, fileId: existingFile.id, createdAt })
            );
          }
        } else {
          const sourceFile = SourceService.getFile(f.sourceId, f.sourceFileId);
          const newFileId = GalleryFileDAO.insert(
            new GalleryFile({
              ...sourceFile,
              sourceId: f.sourceId,
            })
          );
          AlbumFileDAO.insert(new AlbumFile({ albumId, fileId: newFileId }));
        }
      });
    });
  },

  removeFromAlbum(albumId, files = {}) {
    transaction(() => {
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
            AlbumFileDAO.deleteByFileId(existingFile.id);
          }
        }
      });
    });
  },

  getAlbumFiles(id) {
    const albumFiles = AlbumFileDAO.findByAlbumId(id);
    const fileIds = albumFiles.map((f) => f.fileId);
    return GalleryFileDAO.findByIds(fileIds)
      .map(({ id, sourceId, sourceFileId = null }) => ({
        ...SourceService.getFile(sourceId, sourceFileId),
        galleryFileId: id,
        sourceId,
        createdAt: albumFiles.find(f => f.fileId === id).createdAt,
      }));
  },

  findCoverFiles(albumId) {
    const albumFiles = AlbumFileDAO.findByAlbumId(albumId);

    const files = generateUniqueRandomNumbers(albumFiles.length, 4).map(index => albumFiles[index]);
    const fileIds = files.map(f => f.fileId);

    return GalleryFileDAO.findByIds(fileIds)
      .map(({ id, sourceId, sourceFileId }) => ({
        ...SourceService.getFile(sourceId, sourceFileId),
        galleryFileId: id,
        sourceId,
      }));
  },

  generateAlbumToken(id) {
    const album = AlbumDAO.getById(id);
    if (album.token) {
      return album.token;
    }
    album.token = crypto.randomBytes(32).toString('hex');
    AlbumDAO.update(album);
    return album.token;
  },
};

function generateUniqueRandomNumbers(n, count) {
  const numsToFind = n < count ? n : count;
  const uniqueNumbers = new Set();
  while (uniqueNumbers.size < numsToFind) {
    const randomNumber = Math.floor(Math.random() * n);
    uniqueNumbers.add(randomNumber);
  }
  return Array.from(uniqueNumbers);
}