class Album {
  id;
  idAlias;
  name;
  token;
  modifiedDate;

  constructor({ id, idAlias, name, token, modifiedDate }) {
    this.id = id;
    this.idAlias = idAlias;
    this.name = name;
    this.token = token;
    this.modifiedDate = modifiedDate;
  }
}

module.exports = Album;
