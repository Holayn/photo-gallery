export default class Photo {
  date;
  sourceId;
  sourceFileId;
  galleryFileId;
  metadata = {};
  albums = [];
  urls = {};
  createdAt;

  source;

  constructor({ date, sourceId, sourceFileId, galleryFileId, metadata = {}, albums = [], urls = {}, createdAt, source }) {
    this.date = date;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    this.galleryFileId = galleryFileId;
    this.metadata = metadata;
    this.albums = albums;
    this.urls = urls;
    this.createdAt = createdAt;
    this.source = source;
  }

  get id() {
    return `${this.sourceId}_${this.sourceFileId}`;
  }

  isBrokenAlbumFile() {
    return this.galleryFileId != null && this.sourceFileId == null;
  }
}