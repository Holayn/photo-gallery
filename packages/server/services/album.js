const crypto = require('crypto');

const SourceService = require('./source');

const { AlbumDAO, AlbumFileDAO, GalleryFileDAO, transaction } = require('./db');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const GalleryFile = require('../model/gallery-file');

module.exports = {
  createAlbum(name, files = {}) {
    transaction(() => {
      const albumId = AlbumDAO.insert(new Album({ name }));
      this.addToAlbum(albumId, files);
    });
  },

  addToAlbum(albumId, files = {}) {
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
          if (!existsInAlbum) {
            AlbumFileDAO.insert(
              new AlbumFile({ albumId, fileId: existingFile.id })
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

  getAlbumFiles(id) {
    const albumFiles = AlbumFileDAO.findByAlbumId(id);
    const fileIds = albumFiles.map((f) => f.fileId);
    return GalleryFileDAO.findByIds(fileIds)
      .map(({ sourceId, sourceFileId = null }) => ({
        ...SourceService.getFile(sourceId, sourceFileId),
        sourceId,
      }))
      .filter((f) => !!f.sourceFileId);
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
