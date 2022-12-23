const UserService = require('../services/user');

const AuthController = {
  authAdmin(req, res, next) {
    const password = req.query.password;

    

    if (UserService.isValidUser('admin', password)) {
      next();
    } else {
      res.sendStatus(401);
    }
  }
}

module.exports = AuthController;