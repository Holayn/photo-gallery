const crypto = require('crypto');

const { UserDAO } = require('./db');

module.exports = {
  getUser(name, password) {
    if (name && password) {
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      return UserDAO.getByUsernamePassword(name, hash);
    }

    return null;
  },

  getUserByUsername(username) {
    return UserDAO.getUserByUsername(username);
  },
};
