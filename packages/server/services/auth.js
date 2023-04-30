require("dotenv").config();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET not defined in .env!");
}

function getSecret() {
  return process.env.SESSION_SECRET;
}

module.exports = {
  getSecret,
};
