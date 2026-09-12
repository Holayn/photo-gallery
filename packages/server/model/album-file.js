class AlbumFile {
  id;
  albumId;
  fileId;
  createdAt;
  hidden;

  constructor({ id, albumId, fileId, createdAt, hidden = false }) {
    this.id = id;
    this.albumId = albumId;
    this.fileId = fileId;
    this.createdAt = createdAt;
    this.hidden = Boolean(hidden);
  }
}

module.exports = AlbumFile;
