class Album {
  id;
  idAlias;
  name;
  token;

  constructor({ id, idAlias, name, token }) {
    this.id = id;
    this.idAlias = idAlias;
    this.name = name;
    this.token = token;
  }
}

module.exports = Album;
