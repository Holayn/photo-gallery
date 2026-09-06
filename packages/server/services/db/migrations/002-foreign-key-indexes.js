// Indexes for foreign-key columns that are queried directly but were never
// indexed (only their table's own primary key was), so these queries were
// doing full table scans.
module.exports = {
  up(db) {
    db.exec('CREATE INDEX IF NOT EXISTS idx_album_file_album_id ON album_file(album_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_album_file_file_id ON album_file(file_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_file_source_id_source_file_id ON file(source_id, source_file_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_user_source_source_id ON user_source(source_id)');
  },
};
