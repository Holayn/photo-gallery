const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const { toModelFactory } = require('../util/db-utils');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const GalleryFile = require('../model/gallery-file');
const Source = require('../model/source');
const User = require('../model/user');
const { generateRandomString } = require('../util/random');
const UserExploreHistory = require('../model/user-explore-history');

const DB_FILENAME = 'photo-gallery.db';
const DB_PATH = path.resolve(__dirname, `../${DB_FILENAME}`);

fs.mkdirpSync(path.dirname(DB_PATH));

const DB = new Database(DB_PATH);

DB.exec(
  'CREATE TABLE IF NOT EXISTS album_file (id INTEGER PRIMARY KEY, album_id INTEGER, file_id INTEGER, created_at INTEGER, FOREIGN KEY(album_id) REFERENCES album(id), FOREIGN KEY(file_id) REFERENCES file(id))'
);
try {
  DB.exec('ALTER TABLE album_file ADD COLUMN created_at INTEGER');
} catch (e) {}
const toAlbumFileModel = toModelFactory(AlbumFile);
const AlbumFileDAO = {
  insert({ albumId, fileId, createdAt = new Date().getTime() }) {
    return DB.prepare(
      'INSERT INTO album_file (album_id, file_id, created_at) VALUES (@albumId, @fileId, @createdAt)'
    ).run({ albumId, fileId, createdAt }).lastInsertRowid;
  },
  getByAlbumIdFileId(albumId, fileId) {
    return toAlbumFileModel(
      DB.prepare(
        'SELECT * FROM album_file WHERE album_id = ? AND file_id = ?'
      ).get(albumId, fileId)
    );
  },
  findByAlbumId(albumId) {
    return DB.prepare('SELECT * FROM album_file WHERE album_id = ?')
      .all(albumId)
      .map((af) => toAlbumFileModel(af));
  },
  findByFileIds(fileIds) {
    return DB.prepare(
      `SELECT * FROM album_file WHERE file_id IN (${fileIds.map(() => '?').join(',')})`
    )
      .all(fileIds)
      .map((af) => toAlbumFileModel(af));
  },
  deleteByFileId(fileId) {
    DB.prepare('DELETE FROM album_file WHERE file_id = ?').run(fileId);
  },
};

const generateIdAlias = () => generateRandomString(16);
DB.exec(
  'CREATE TABLE IF NOT EXISTS album (id INTEGER PRIMARY KEY, name TEXT, token TEXT, id_alias TEXT)'
);

const toAlbumModel = toModelFactory(Album);
const AlbumDAO = {
  insert({ name }) {
    const idAlias = generateIdAlias();
    return DB.prepare(
      'INSERT INTO album (id_alias, name) VALUES (@idAlias, @name)'
    ).run({ idAlias, name }).lastInsertRowid;
  },
  findAll() {
    return DB.prepare('SELECT * FROM album')
      .all()
      .map((a) => toAlbumModel(a));
  },
  getById(id) {
    return toAlbumModel(DB.prepare('SELECT * FROM album WHERE id = ?').get(id));
  },
  getByIdAlias(idAlias) {
    return toAlbumModel(
      DB.prepare('SELECT * FROM album WHERE id_alias = ?').get(idAlias)
    );
  },
  getByIdToken(idAlias, token) {
    return toAlbumModel(
      DB.prepare('SELECT * FROM album WHERE id_alias = ? AND token = ?').get(
        idAlias,
        token
      )
    );
  },
  update({ id, name, token }) {
    DB.prepare(
      'UPDATE album SET name = @name, token = @token WHERE id = @id'
    ).run({ id, name, token });
  },
};

DB.exec(
  'CREATE TABLE IF NOT EXISTS file (id INTEGER PRIMARY KEY, timestamp_added INTEGER, date INTEGER, source_id INTEGER, source_file_id INTEGER, FOREIGN KEY(source_id) REFERENCES source(id))'
);
const toGalleryFileModel = toModelFactory(GalleryFile);
const GalleryFileDAO = {
  insert({ date, sourceId, sourceFileId }) {
    return DB.prepare(
      'INSERT INTO file (timestamp_added, date, source_id, source_file_id) VALUES (@timestampAdded, @date, @sourceId, @sourceFileId)'
    ).run({
      date,
      sourceId,
      sourceFileId,
      timestampAdded: new Date().getTime(),
    }).lastInsertRowid;
  },
  update(file) {
    DB.prepare(
      'UPDATE file SET date = @date, source_id = @sourceId, source_file_id = @sourceFileId WHERE id = @id'
    ).run(file);
  },
  findBySourceId(sourceId) {
    return DB.prepare('SELECT * FROM file WHERE source_id = ?')
      .all(sourceId)
      .map((f) => toGalleryFileModel(f));
  },
  getBySource(sourceId, sourceFileId) {
    return toGalleryFileModel(
      DB.prepare(
        'SELECT * FROM file WHERE source_id = ? AND source_file_id = ?'
      ).get(sourceId, sourceFileId)
    );
  },
  findByIds(fileIds) {
    return DB.prepare(
      `SELECT * FROM file WHERE id IN (${fileIds.map(() => '?').join(', ')}) ORDER BY date`
    )
      .all(fileIds)
      .map((f) => toGalleryFileModel(f));
  },
  findBySourceFileIds(sourceId, sourceFileIds) {
    return DB.prepare(
      `SELECT * FROM file WHERE source_id = ? AND source_file_id IN (${sourceFileIds.map(() => '?').join(',')})`
    )
      .all(sourceId, sourceFileIds)
      .map((f) => toGalleryFileModel(f));
  },
};

DB.exec(
  'CREATE TABLE IF NOT EXISTS source (id INTEGER PRIMARY KEY, path STRING, alias STRING)'
);
const toSourceModel = toModelFactory(Source);
const SourceDAO = {
  insert({ path: sourcePath, alias }) {
    return DB.prepare(
      'INSERT INTO source (path, alias) VALUES (@path, @alias)'
    ).run({ path: sourcePath, alias }).lastInsertRowid;
  },
  getById(id) {
    return toSourceModel(
      DB.prepare('SELECT * FROM source WHERE id = ?').get(id)
    );
  },
  getSourceByPathOrAlias(sourcePath, alias) {
    return toSourceModel(
      DB.prepare('SELECT * FROM source WHERE path = ? OR alias = ?').get(
        sourcePath,
        alias
      )
    );
  },
  getSourceByAlias(alias) {
    return toSourceModel(
      DB.prepare('SELECT * FROM source WHERE alias = ?').get(alias)
    );
  },
  findAll() {
    return DB.prepare('SELECT * FROM source')
      .all()
      .map((s) => toSourceModel(s));
  },
};

DB.exec(
  'CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, name TEXT, notify_user TEXT)'
);
try {
  DB.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_name_unique ON user(name)');
} catch (e) {}
const toUserModel = toModelFactory(User);
const UserDAO = {
  getByUsername(username) {
    return toUserModel(
      DB.prepare('SELECT * FROM user WHERE name = ?').get(username)
    );
  },
  getById(id) {
    return toUserModel(
      DB.prepare('SELECT * FROM user WHERE id = ?').get(id)
    );
  },
  findAll() {
    return DB.prepare('SELECT id, name, notify_user FROM user')
      .all()
      .map((u) => toUserModel(u));
  },
  upsert({ name, notifyUser }) {
    return DB.prepare(
      `INSERT INTO user (name, notify_user) VALUES (@name, @notifyUser)
       ON CONFLICT(name) DO UPDATE SET notify_user = @notifyUser`
    ).run({ name, notifyUser: notifyUser ?? null }).lastInsertRowid;
  },
};

DB.exec(
  'CREATE TABLE IF NOT EXISTS user_source (id INTEGER PRIMARY KEY, user_id INTEGER, source_id INTEGER, FOREIGN KEY(user_id) REFERENCES user(id), FOREIGN KEY(source_id) REFERENCES source(id))'
);
try {
  DB.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_source_unique ON user_source(user_id, source_id)');
} catch (e) {}

const UserSourceDAO = {
  insert({ userId, sourceId }) {
    try {
      return DB.prepare(
        'INSERT INTO user_source (user_id, source_id) VALUES (@userId, @sourceId)'
      ).run({ userId, sourceId }).lastInsertRowid;
    } catch (e) {
      // Ignore duplicate entries
      return null;
    }
  },
  delete({ userId, sourceId }) {
    return DB.prepare(
      'DELETE FROM user_source WHERE user_id = @userId AND source_id = @sourceId'
    ).run({ userId, sourceId }).changes;
  },
  findUsersBySourceId(sourceId) {
    return DB.prepare(
      'SELECT u.id, u.name, u.notify_user FROM user u INNER JOIN user_source us ON u.id = us.user_id WHERE us.source_id = ?'
    )
      .all(sourceId)
      .map((u) => toUserModel(u));
  },
  hasAccess(userId, sourceId) {
    const result = DB.prepare(
      'SELECT 1 FROM user_source WHERE user_id = ? AND source_id = ?'
    ).get(userId, sourceId);
    return !!result;
  },
};

DB.exec(
  'CREATE TABLE IF NOT EXISTS user_explore_history (id INTEGER PRIMARY KEY, user_id INTEGER, source_id INTEGER, source_file_id INTEGER, FOREIGN KEY(user_id) REFERENCES user(id), FOREIGN KEY(source_id) REFERENCES source(id))'
);
try {
  DB.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_explore_history_unique ON user_explore_history(user_id, source_id, source_file_id)');
} catch (e) {}

const toUserExploreHistoryModel = toModelFactory(UserExploreHistory);
const UserExploreHistoryDAO = {
  insert({ userId, sourceId, sourceFileId }) {
    return DB.prepare(
      'INSERT INTO user_explore_history (user_id, source_id, source_file_id) VALUES (@userId, @sourceId, @sourceFileId)'
    ).run({ userId, sourceId, sourceFileId }).lastInsertRowid;
  },
  getByUserIdSourceIdFileId(userId, sourceId, sourceFileId) {
    return toUserExploreHistoryModel(DB.prepare(
      'SELECT * FROM user_explore_history WHERE user_id = ? AND source_id = ? AND source_file_id = ?'
    ).get(userId, sourceId, sourceFileId));
  },
  getMostRecent(userId) {
    return toUserExploreHistoryModel(DB.prepare(
      'SELECT * FROM user_explore_history WHERE user_id = ? ORDER BY id DESC LIMIT 1'
    ).get(userId));
  },
  getByUserId(userId) {
    return DB.prepare(
      'SELECT * FROM user_explore_history WHERE user_id = ?'
    ).all(userId).map((u) => toUserExploreHistoryModel(u));
  },
  deleteByUserId(userId) {
    return DB.prepare(
      'DELETE FROM user_explore_history WHERE user_id = ?'
    ).run(userId);
  },
}

function attachDB(dbPath) {
  DB.prepare('ATTACH DATABASE ? AS attached_db').run(dbPath);
  return 'attached_db';
}

function detachDB() {
  DB.prepare('DETACH DATABASE attached_db').run();
}

function findUnexploredFile(dbPath, userId) {
  const attachedDbName = attachDB(dbPath);

  try {
    // Compute count and pick a random offset in SQL so it's always in sync
    // with the live user_explore_history table, even under parallel requests.
    const { count } = DB.prepare(`
      SELECT COUNT(*) AS count FROM ${attachedDbName}.files attached_processor_source_files
      LEFT JOIN user_explore_history ueh ON attached_processor_source_files.id = ueh.source_file_id AND ueh.user_id = ?
      WHERE ueh.id IS NULL AND attached_processor_source_files.processed != 0
    `).get(userId);

    if (!count) return null;

    const offset = Math.floor(Math.random() * count);

    return DB.prepare(`
      SELECT attached_processor_source_files.* FROM ${attachedDbName}.files attached_processor_source_files
      LEFT JOIN user_explore_history ueh ON attached_processor_source_files.id = ueh.source_file_id AND ueh.user_id = ?
      WHERE ueh.id IS NULL AND attached_processor_source_files.processed != 0
      LIMIT 1 OFFSET ?
    `).get(userId, offset);
  } finally {
    detachDB(attachedDbName);
  }
}

module.exports = {
  AlbumFileDAO,
  AlbumDAO,
  GalleryFileDAO,
  SourceDAO,
  UserDAO,
  UserSourceDAO,
  UserExploreHistoryDAO,
  attachDB,
  detachDB,
  findUnexploredFile,
  transaction: (fn) => {
    return DB.transaction(() => {
      return fn();
    })();
  },
};
