class AlbumFile {
  id;
  albumId;
  fileId;

  constructor({ id, albumId, fileId }) {
    this.id = id;
    this.albumId = albumId;
    this.fileId = fileId;
  }
}

module.exports = AlbumFile;
