const crypto = require('crypto');

const User = require('../model/user');

module.exports = {
  isValidUser(name, password) {
    throw new Error('foo');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return !!User.getByNamePass(name, hash);
  },
}