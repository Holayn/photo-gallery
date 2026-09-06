const { columnExists } = require('../migration-utils');

// Captures the schema as it existed before the migration system was introduced.
// CREATE TABLE/INDEX statements use IF NOT EXISTS and column adds are guarded so
// this is safe to run both against a brand-new database and against an existing
// production database that already has these tables/columns.
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS album_file (
        id INTEGER PRIMARY KEY,
        album_id INTEGER,
        file_id INTEGER,
        created_at INTEGER,
        FOREIGN KEY(album_id) REFERENCES album(id),
        FOREIGN KEY(file_id) REFERENCES file(id)
      )
    `);
    if (!columnExists(db, 'album_file', 'created_at')) {
      db.exec('ALTER TABLE album_file ADD COLUMN created_at INTEGER');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS album (
        id INTEGER PRIMARY KEY,
        name TEXT,
        token TEXT,
        id_alias TEXT
      )
    `);
    if (!columnExists(db, 'album', 'modified_date')) {
      db.exec('ALTER TABLE album ADD COLUMN modified_date INTEGER');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS file (
        id INTEGER PRIMARY KEY,
        timestamp_added INTEGER,
        date INTEGER,
        source_id INTEGER,
        source_file_id INTEGER,
        FOREIGN KEY(source_id) REFERENCES source(id)
      )
    `);
    if (!columnExists(db, 'file', 'token')) {
      db.exec('ALTER TABLE file ADD COLUMN token TEXT');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS source (
        id INTEGER PRIMARY KEY,
        path TEXT,
        alias TEXT
      )
    `);
    if (!columnExists(db, 'source', 'processed')) {
      db.exec('ALTER TABLE source ADD COLUMN processed INTEGER NOT NULL DEFAULT 1');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY,
        name TEXT
      )
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_name_unique ON user(name)');

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_source (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        source_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES user(id),
        FOREIGN KEY(source_id) REFERENCES source(id)
      )
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_source_unique ON user_source(user_id, source_id)');

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_explore_history (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        source_id INTEGER,
        source_file_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES user(id),
        FOREIGN KEY(source_id) REFERENCES source(id)
      )
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_explore_history_unique ON user_explore_history(user_id, source_id, source_file_id)');

    db.exec(`
      CREATE TABLE IF NOT EXISTS push_subscription (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        endpoint TEXT,
        subscription TEXT,
        created_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES user(id)
      )
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscription_user_endpoint ON push_subscription(user_id, endpoint)');
  },
};
