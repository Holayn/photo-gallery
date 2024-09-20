class User {
  id;
  name;
  password;

  constructor({ id, name, password, notifyUser }) {
    this.id = id;
    this.name = name;
    this.password = password;
    this.notifyUser = notifyUser;
  }
}

module.exports = User;
