class Source {
  id;
  alias;
  path;
  processed;

  constructor({ id, alias, path, processed = true }) {
    this.id = id;
    this.alias = alias;
    this.path = path;
    this.processed = Boolean(processed);
  }
}

module.exports = Source;
