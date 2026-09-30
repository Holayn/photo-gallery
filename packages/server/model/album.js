class Album {
  id;
  idAlias;
  name;
  token;
  modifiedDate;
  hidden;
  createdBy;

  constructor({ id, idAlias, name, token, modifiedDate, hidden = false, createdBy }) {
    this.id = id;
    this.idAlias = idAlias;
    this.name = name;
    this.token = token;
    this.modifiedDate = modifiedDate;
    this.hidden = Boolean(hidden);
    this.createdBy = createdBy;
  }
}

module.exports = Album;
