const crypto = require("crypto");

const SourceService = require("./source");

const Album = require("../model/album");
const AlbumFile = require("../model/album-file");
const File = require("../model/file");

module.exports = {
  createAlbum(name, files = {}) {
    const albumId = Album.insert(name, generateAlbumToken());
    this.addToAlbum(albumId, files);
  },

  addToAlbum(albumId, files = {}) {
    Object.keys(files).forEach((file) => {
      const f = files[file];
      const existingFile = File.getBySource(f.sourceId, f.sourceFileId);
      if (existingFile) {
        const existsInAlbum = AlbumFile.getByAlbumIdFileId(
          albumId,
          existingFile.id
        );
        if (!existsInAlbum) {
          AlbumFile.insert(albumId, existingFile.id);
        }
      } else {
        const sourceFile = SourceService.getSourceFile(
          f.sourceId,
          f.sourceFileId
        );
        const newFileId = File.insert({
          ...sourceFile,
          sourceId: f.sourceId,
        });
        AlbumFile.insert(albumId, newFileId);
      }
    });
  },

  findAllAlbums() {
    return Album.findAll();
  },

  getAlbum(id) {
    return Album.get(id);
  },

  getAlbumFiles(id, start, num) {
    const albumFiles = AlbumFile.findByAlbumId(id);
    const fileIds = albumFiles.map((f) => f.file_id);
    return File.findByIds(fileIds, start, num);
  },
};

function generateAlbumToken() {
  return crypto.randomBytes(16).toString("hex");
}
