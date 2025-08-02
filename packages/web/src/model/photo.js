export default class Photo {
  date;
  sourceId;
  sourceFileId;
  galleryFileId;
  metadata = {};
  albums = [];
  urls = {};
  createdAt;

  constructor({ date, sourceId, sourceFileId, galleryFileId, metadata = {}, albums = [], urls = {}, createdAt }) {
    this.date = date;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    this.galleryFileId = galleryFileId;
    this.metadata = metadata;
    this.albums = albums;
    this.urls = urls;
    this.createdAt = createdAt;
  }

  get id() {
    return `${this.sourceId}_${this.sourceFileId}`;
  }

  isBrokenAlbumFile() {
    return this.galleryFileId != null && this.sourceFileId == null;
  }
}