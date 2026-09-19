const ProcessorSourceFileMetadata = require('./processor-source-file-metadata');

class ProcessorSourceFile {
  constructor({ id, path, fileName, fileDate, date, metadata, sourceId, createdAt, previewOnly }) {
    this.id = id;
    this.path = path;
    this.date = date;
    this.fileName = fileName;
    this.fileDate = fileDate;
    this.metadata = new ProcessorSourceFileMetadata(JSON.parse(metadata));
    this.sourceId = sourceId;
    this.createdAt = createdAt;
    this.previewOnly = Boolean(previewOnly);
  }
}

module.exports = ProcessorSourceFile;
