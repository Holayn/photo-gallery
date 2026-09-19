class GalleryFile {
  id;
  date;
  sourceId;
  sourceFileId;
  timestampAdded;
  token;
  processing;

  constructor({ id, date, sourceId, sourceFileId, timestampAdded, token, processing = false }) {
    this.id = id;
    this.date = date;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    this.timestampAdded = timestampAdded;
    this.token = token;
    this.processing = Boolean(processing);
  }
}

module.exports = GalleryFile;
