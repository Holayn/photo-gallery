class GalleryFile {
  id;
  date;
  sourceId;
  sourceFileId;
  timestampAdded;

  constructor({ id, date, sourceId, sourceFileId, timestampAdded }) {
    this.id = id;
    this.date = date;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    this.timestampAdded = timestampAdded;
  }
}

module.exports = GalleryFile;
