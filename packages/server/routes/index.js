const express = require('express');

const auth = require('./auth');
const source = require('./source');
const album = require('./album');
const photo = require('./photo');
const memories = require('./memories');
const explore = require('./explore');

const router = express.Router();
router.use(auth.router);
router.use(source);
router.use(album);
router.use(photo);
router.use(memories);
router.use(explore);

router.get('/test', (req, res) => {
  res.sendStatus(200);
});

module.exports = router;
