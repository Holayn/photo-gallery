class Source {
  id;
  alias;
  path;

  constructor({ id, alias, path }) {
    this.id = id;
    this.alias = alias;
    this.path = path;
  }
}

module.exports = Source;
