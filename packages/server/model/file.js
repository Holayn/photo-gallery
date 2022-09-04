const DbSource = require('../services/db-source');
const SourceService = require('../services/source');
const FileMetadata = require('./file-metadata');

class File {
  constructor({ id, date, metadata, sourceId, sourceFileId }) {
    this.id = id;
    this.date = date;
    this.metadata = metadata;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
    if (typeof metadata === 'string') {
      this.metadata = new FileMetadata(JSON.parse(metadata));
    } else {
      this.metadata = new FileMetadata(metadata);
    }
  }

  getData(size) {
    const source = SourceService.getSource(this.sourceId);
    const dbSource = new DbSource(source);
    const file = dbSource.getFile(this.sourceFileId, size);
    if (file) {
      return file;
    }
  }
}

module.exports = File;