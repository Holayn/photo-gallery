class User {
  id;
  name;

  constructor({ id, name, notifyUser }) {
    this.id = id;
    this.name = name;
    this.notifyUser = notifyUser;
  }
}

module.exports = User;
