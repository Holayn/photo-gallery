require('dotenv').config();
const fs = require('fs');

function wakeDisk() {
  const diskToWakePath = process.env.DISK_TO_WAKE_PATH;
  if (diskToWakePath) {
    fs.readdirSync(diskToWakePath);
  }
}

module.exports = wakeDisk;