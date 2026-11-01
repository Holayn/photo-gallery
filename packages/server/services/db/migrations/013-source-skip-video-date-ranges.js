const { columnExists } = require('../migration-utils');

// Date ranges ("YYYY-MM-DD:YYYY-MM-DD", ";"-delimited) whose videos webimg
// leaves preview-only instead of converting when processing this source.
// NULL means no ranges.
module.exports = {
  up(db) {
    if (!columnExists(db, 'source', 'skip_video_date_ranges')) {
      db.exec('ALTER TABLE source ADD COLUMN skip_video_date_ranges TEXT');
    }
  },
};
