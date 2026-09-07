class Source {
  id;
  alias;
  path;
  processed;
  filesPath;
  processing;
  continuous;

  constructor({ id, alias, path, processed = true, filesPath, processing = false, continuous = false }) {
    this.id = id;
    this.alias = alias;
    this.path = path;
    this.processed = Boolean(processed);
    this.filesPath = filesPath;
    this.processing = Boolean(processing);
    this.continuous = Boolean(continuous);
  }
}

module.exports = Source;
