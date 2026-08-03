class GalleryFile {
  id;
  date;
  sourceId;
  sourceFileId;
  timestampAdded;
  token;

  constructor({ id, date, sourceId, sourceFileId, timestampAdded, token }) {
    this.id = id;
    this.date = date;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    this.timestampAdded = timestampAdded;
    this.token = token;
  }
}

module.exports = GalleryFile;
