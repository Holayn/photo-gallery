export default class Photo {
  date;
  sourceId;
  sourceFileId;
  galleryFileId;
  metadata = {};
  albums = [];
  urls = {};

  constructor({ date, sourceId, sourceFileId, galleryFileId, metadata = {}, albums = [], urls = {} }) {
    this.date = date;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    this.galleryFileId = galleryFileId;
    this.metadata = metadata;
    this.albums = albums;
    this.urls = urls;
  }

  get clientId() {
    return `${this.sourceId}_${this.sourceFileId}`;
  }

  isBrokenAlbumFile() {
    return this.galleryFileId != null && this.sourceFileId == null;
  }
}