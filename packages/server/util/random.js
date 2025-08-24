function generateUniqueRandomNumbers(n, count) {
  const numsToFind = n < count ? n : count;
  const uniqueNumbers = new Set();
  while (uniqueNumbers.size < numsToFind) {
    const randomNumber = Math.floor(Math.random() * n);
    uniqueNumbers.add(randomNumber);
  }
  return Array.from(uniqueNumbers);
}

function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

module.exports = {
  generateUniqueRandomNumbers,
  generateRandomString,
}