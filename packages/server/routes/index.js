const express = require('express');

const auth = require('./auth');
const source = require('./source');
const album = require('./album');
const photo = require('./photo');
const memories = require('./memories');
const explore = require('./explore');
const pushSubscription = require('./push-subscription');
const AuthController = require('../controllers/auth');
const SourceService = require('../services/source');
const AlbumService = require('../services/album');
const { SourceDAO, AlbumDAO } = require('../services/db');

const apiRouter = express.Router();
apiRouter.use(auth.apiRouter);
apiRouter.use(source);
apiRouter.use(album);
apiRouter.use(photo);
apiRouter.use(memories);
apiRouter.use(explore);
apiRouter.use(pushSubscription);

apiRouter.get('/test', (req, res) => {
  res.sendStatus(200);
});

apiRouter.get('/recently-updated', AuthController.authAdmin, (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const sources = SourceDAO.findRecentlyUpdated(limit).map((source) => ({
    type: 'source',
    id: source.id,
    name: source.alias,
    updatedDate: source.updatedDate,
    fileCount: source.processed ? SourceService.getFileCount(source.id) : 0,
  }));

  const albums = AlbumDAO.findRecentlyUpdated(limit).map((album) => ({
    type: 'album',
    id: album.idAlias,
    name: album.name,
    updatedDate: album.modifiedDate,
    fileCount: AlbumService.getFileCount(album.id),
  }));

  const collections = [...sources, ...albums]
    .sort((a, b) => b.updatedDate - a.updatedDate)
    .slice(0, limit);

  res.send(collections);
});

module.exports = {
  apiRouter,
  pageRouter: auth.pageRouter,
};
