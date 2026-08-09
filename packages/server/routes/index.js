const express = require('express');

const auth = require('./auth');
const source = require('./source');
const album = require('./album');
const photo = require('./photo');
const memories = require('./memories');
const explore = require('./explore');

const apiRouter = express.Router();
apiRouter.use(auth.apiRouter);
apiRouter.use(source);
apiRouter.use(album);
apiRouter.use(photo);
apiRouter.use(memories);
apiRouter.use(explore);

apiRouter.get('/test', (req, res) => {
  res.sendStatus(200);
});

module.exports = {
  apiRouter,
  pageRouter: auth.pageRouter,
};
