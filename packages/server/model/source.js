class Source {
  id;
  alias;
  path;
  processed;
  filesPath;

  constructor({ id, alias, path, processed = true, filesPath }) {
    this.id = id;
    this.alias = alias;
    this.path = path;
    this.processed = Boolean(processed);
    this.filesPath = filesPath;
  }
}

module.exports = Source;
