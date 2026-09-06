const DB = require('./connection');

// better-sqlite3 runs everything synchronously on one connection, so only one
// database is ever attached at a time here (no await splits attach from
// detach) - a single fixed alias is safe and avoids the alias-name bookkeeping
// that would only matter if this were truly concurrent.
const ATTACHED_DB_ALIAS = 'attached_db';

function attachDB(dbPath) {
  DB.prepare(`ATTACH DATABASE ? AS ${ATTACHED_DB_ALIAS}`).run(dbPath);
  return ATTACHED_DB_ALIAS;
}

function detachDB() {
  DB.prepare(`DETACH DATABASE ${ATTACHED_DB_ALIAS}`).run();
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
    detachDB();
  }
}

module.exports = { attachDB, detachDB, findUnexploredFile };
