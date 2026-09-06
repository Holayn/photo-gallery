const fs = require('fs');
const path = require('path');

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
}

function runMigrations(db, migrationsDir = path.join(__dirname, 'migrations')) {
  ensureMigrationsTable(db);

  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((row) => row.id)
  );

  const pendingFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .filter((file) => !applied.has(path.basename(file, '.js')));

  for (const file of pendingFiles) {
    const id = path.basename(file, '.js');
    // eslint-disable-next-line global-require, import/no-dynamic-require -- migrations are loaded by discovered filename
    const migration = require(path.join(migrationsDir, file));

    db.transaction(() => {
      migration.up(db);
      db.prepare(
        'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)'
      ).run(id, Date.now());
    })();
  }
}

module.exports = { runMigrations };
