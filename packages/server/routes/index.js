const express = require('express');

const FileService = require('../services/file');

require('dotenv').config();

const DEFAULT_PAGE_SIZE = 50;

const router = express.Router();

router.get('/photos', async (req, res) => {
  const page = req.query.page || 0;
  const pageSize = req.query.pageSize || DEFAULT_PAGE_SIZE;
  const files = FileService.findFilesInPage(parseInt(page), pageSize);
  const hasNextPage = files.length >= req.query.pageSize;
  res.send({
    info: {
      hasNextPage,
    },
    photos: files,
  });
});

router.get('/photo', (req, res) => {
  const id = req.query.id;
  const size = req.query.size;
  const file = FileService.getFile(id);
  if (file) {
    const fileData = file.getData(size);
    if (fileData) {
      const { data, fileType } = fileData;
      res.contentType(fileType);
      res.send(data);
    } else {
      res.status(404).send('Photo not found.');
    }
  } else {
    res.status(400).send('Invalid photo id.');
  }
});

module.exports = router;