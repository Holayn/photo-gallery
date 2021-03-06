const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

const AVAILABLE_ALBUMS = process.env.AVAILABLE_ALBUMS.split(',');
const ALBUM_TITLES = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/album-titles.json')));

router.use('/test', (req, res) => {
  res.sendStatus(200);
});
router.use('/', express.static(path.join(__dirname, '../../../../photo-gallery-media')));
router.use('/config', (req, res) => {
  const album = req.query.album;
  if (AVAILABLE_ALBUMS.includes(album)) {
    res.send(fs.readFileSync(path.join(__dirname, `../config/photos/${album}/photos.json`)));
  } else {
    res.sendStatus(404);
  }
});
router.use('/title', (req, res) => {
  res.send({
    title: ALBUM_TITLES[req.query.album]
  });
});

module.exports = router;