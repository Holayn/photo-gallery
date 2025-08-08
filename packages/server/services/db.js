const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const { toModelFactory } = require('../util/db-utils');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const GalleryFile = require('../model/gallery-file');
const Source = require('../model/source');
const User = require('../model/user');

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

const generateIdAlias = () =>
  Array.from({ length: 6 }, () =>
    Math.random().toString(36).substring(2, 3)
  ).join('');
DB.exec(
  'CREATE TABLE IF NOT EXISTS album (id INTEGER PRIMARY KEY, name TEXT, token TEXT, id_alias TEXT)'
);

const toAlbumModel = toModelFactory(Album);
const AlbumDAO = {
  insert({ name }) {
    let idAlias = generateIdAlias();
    while (
      DB.prepare('SELECT * FROM album WHERE id_alias = ?').get(idAlias) != null
    ) {
      idAlias = generateIdAlias();
    }
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
      `SELECT * FROM file WHERE id IN (${fileIds.join(', ')}) ORDER BY date`
    )
      .all()
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
  'CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, name TEXT, password TEXT, notify_user TEXT)'
);
const toUserModel = toModelFactory(User);
const UserDAO = {
  getByUsernamePassword(name, password) {
    return toUserModel(
      DB.prepare('SELECT * FROM user WHERE name = ? AND password = ?').get(
        name,
        password
      )
    );
  },
  getByUsername(username) {
    return toUserModel(
      DB.prepare('SELECT * FROM user WHERE name = ?').get(username)
    );
  },
};

module.exports = {
  AlbumFileDAO,
  AlbumDAO,
  GalleryFileDAO,
  SourceDAO,
  UserDAO,
  transaction: (fn) => {
    return DB.transaction(() => {
      return fn();
    })();
  },
};
