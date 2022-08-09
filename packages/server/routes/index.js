const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const Collection = require('../services/collection');
const photos = require('../services/photos');

require('dotenv').config();

const router = express.Router();

router.get('/photos', (req, res) => {
  res.send(photos.filesToPhotos(new Collection().findAllFiles()));
});

router.get('/photo', (req, res) => {
  const collection = new Collection();
  const id = req.query.id;
  const size = req.query.size;
  const file = collection.getFile(id);
  if (file) {
    const fileOfSize = file[photos.sizes[size]];
    if (fileOfSize) {
      const source = collection.getSource(file.source_id);
      const photoPath = path.resolve(source.path, fileOfSize);
      if (fs.existsSync(photoPath)) {
        res.contentType(photoPath);
        res.send(fs.readFileSync(photoPath));
      } else {
        res.status(404).send('Photo not found.');
      }
    } else {
      res.status(400).send('Invalid photo size.');
    }
  } else {
    res.status(400).send('Invalid photo id.');
  }
});

module.exports = router;