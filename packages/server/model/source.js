class Source {
  id;
  alias;
  path;
  processed;
  filesPath;
  processing;

  constructor({ id, alias, path, processed = true, filesPath, processing = false }) {
    this.id = id;
    this.alias = alias;
    this.path = path;
    this.processed = Boolean(processed);
    this.filesPath = filesPath;
    this.processing = Boolean(processing);
  }
}

module.exports = Source;
