class AlbumFile {
  id;
  albumId;
  fileId;
  createdAt;

  constructor({ id, albumId, fileId, createdAt }) {
    this.id = id;
    this.albumId = albumId;
    this.fileId = fileId;
    this.createdAt = createdAt;
  }
}

module.exports = AlbumFile;
