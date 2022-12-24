const jwt = require('jsonwebtoken');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET not defined in .env!');
}

function generateToken(username) {
  return new Promise((res, rej) => {
    jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' }, function(err, token) {
      res(token);
    });
  });
}

function validateToken(token) {
  return new Promise((res, rej) => {
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      res(!err);
    });
  });
}

module.exports = {
  generateToken,
  validateToken
}