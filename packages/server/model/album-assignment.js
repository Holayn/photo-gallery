class AlbumAssignment {
  id;
  userId;
  albumId;

  constructor({ id, userId, albumId }) {
    this.id = id;
    this.userId = userId;
    this.albumId = albumId;
  }
}

module.exports = AlbumAssignment;
