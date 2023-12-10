const crypto = require("crypto");

const DB = require("./db");
const User = require("../model/user");

DB.exec(
  "CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, name TEXT, password TEXT)"
);

function dbRecordToUser(record) {
  return new User({
    name: record.name,
    permissions: record.permissions,
  });
}

module.exports = {
  getUser(name, password) {
    if (name && password) {
      const hash = crypto.createHash("sha256").update(password).digest("hex");

      const record = DB.prepare(
        "SELECT * FROM user WHERE name = ? AND password = ?"
      ).get(name, hash);
      if (record) {
        return dbRecordToUser(record);
      }
    }

    return null;
  },

  getUserByUsername(username) {
    const record = DB.prepare(
      "SELECT * FROM user WHERE name = ?"
    ).get(username);
    if (record) {
      return dbRecordToUser(record);
    }

    return null;
  },
};
