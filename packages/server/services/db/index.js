const DB = require('./connection');
const { runMigrations } = require('./migrate');

runMigrations(DB);

const AlbumFileDAO = require('./dao/album-file');
const AlbumDAO = require('./dao/album');
const GalleryFileDAO = require('./dao/gallery-file');
const SourceDAO = require('./dao/source');
const UserDAO = require('./dao/user');
const UserSourceDAO = require('./dao/user-source');
const UserExploreHistoryDAO = require('./dao/user-explore-history');
const PushSubscriptionDAO = require('./dao/push-subscription');
const { attachDB, detachDB, findUnexploredFile } = require('./attached-source');

module.exports = {
  AlbumFileDAO,
  AlbumDAO,
  GalleryFileDAO,
  SourceDAO,
  UserDAO,
  UserSourceDAO,
  UserExploreHistoryDAO,
  PushSubscriptionDAO,
  attachDB,
  detachDB,
  findUnexploredFile,
  transaction: (fn) => DB.transaction(() => fn())(),
};
