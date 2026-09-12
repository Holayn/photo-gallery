class Album {
  id;
  idAlias;
  name;
  token;
  modifiedDate;
  hidden;

  constructor({ id, idAlias, name, token, modifiedDate, hidden = false }) {
    this.id = id;
    this.idAlias = idAlias;
    this.name = name;
    this.token = token;
    this.modifiedDate = modifiedDate;
    this.hidden = Boolean(hidden);
  }
}

module.exports = Album;
