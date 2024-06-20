const crypto = require('crypto');

const SourceService = require('./source');

const { AlbumDAO, AlbumFileDAO, GalleryFileDAO } = require('./db');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const GalleryFile = require('../model/gallery-file');

module.exports = {
  createAlbum(name, files = {}) {
    const albumId = AlbumDAO.insert(
      new Album({ name, token: generateAlbumToken() })
    );
    this.addToAlbum(albumId, files);
  },

  addToAlbum(albumId, files = {}) {
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
  },

  getAlbumFiles(id, start, num) {
    const albumFiles = AlbumFileDAO.findByAlbumId(id);
    const fileIds = albumFiles.map((f) => f.fileId);
    return GalleryFileDAO.findByIds(fileIds, start, num);
  },
};

function generateAlbumToken() {
  return crypto.randomBytes(16).toString('hex');
}
