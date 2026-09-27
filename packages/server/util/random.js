const crypto = require('crypto');

function generateUniqueRandomNumbers(n, count) {
  const numsToFind = n < count ? n : count;
  const uniqueNumbers = new Set();
  while (uniqueNumbers.size < numsToFind) {
    const randomNumber = Math.floor(Math.random() * n);
    uniqueNumbers.add(randomNumber);
  }
  return Array.from(uniqueNumbers);
}

// Used for share tokens, so it must use a CSPRNG - Math.random()'s internal state
// can be recovered from its output, which would let one token predict others.
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(crypto.randomInt(charset.length));
  }
  return result;
}

module.exports = {
  generateUniqueRandomNumbers,
  generateRandomString,
}