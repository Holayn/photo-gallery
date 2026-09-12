const { columnExists } = require('../migration-utils');

// Tracks when a source last finished processing, so sources can be surfaced
// alongside albums in a unified "recently updated" list instead of only
// albums having that concept via modified_date.
module.exports = {
  up(db) {
    if (!columnExists(db, 'source', 'updated_date')) {
      db.exec('ALTER TABLE source ADD COLUMN updated_date INTEGER');
    }
  },
};
