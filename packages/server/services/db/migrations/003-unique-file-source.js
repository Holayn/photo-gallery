// Enforces one file row per (source_id, source_file_id) so the file table can
// be safely upserted into (backfill, and later ingestion on every processing
// run) instead of only ever being inserted into after an existence check.
// Replaces the plain index added in 002 with a unique one covering the same
// columns, since a unique index also serves lookups.
module.exports = {
  up(db) {
    db.exec('DROP INDEX IF EXISTS idx_file_source_id_source_file_id');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_file_source_unique ON file(source_id, source_file_id)');
  },
};
