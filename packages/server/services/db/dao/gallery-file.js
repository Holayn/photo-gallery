const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const GalleryFile = require('../../../model/gallery-file');

const toGalleryFileModel = toModelFactory(GalleryFile);

module.exports = {
  insert(file) {
    return DB.prepare(
      'INSERT INTO file (timestamp_added, date, source_id, source_file_id, token) VALUES (@timestampAdded, @date, @sourceId, @sourceFileId, @token)'
    ).run({
      ...file,
      timestampAdded: new Date().getTime(),
    }).lastInsertRowid;
  },
  update(file) {
    DB.prepare(
      'UPDATE file SET date = @date, source_id = @sourceId, source_file_id = @sourceFileId, token = @token WHERE id = @id'
    ).run({ ...file });
  },
  upsertFromSource({ sourceId, sourceFileId, date }) {
    return DB.prepare(
      `INSERT INTO file (timestamp_added, date, source_id, source_file_id)
       VALUES (@timestampAdded, @date, @sourceId, @sourceFileId)
       ON CONFLICT(source_id, source_file_id) DO UPDATE SET date = excluded.date`
    ).run({
      timestampAdded: new Date().getTime(),
      date,
      sourceId,
      sourceFileId,
    }).lastInsertRowid;
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
    if (!fileIds.length) {
      return [];
    }
    return DB.prepare(
      `SELECT * FROM file WHERE id IN (${fileIds.map(() => '?').join(', ')}) ORDER BY date`
    )
      .all(fileIds)
      .map((f) => toGalleryFileModel(f));
  },
  findBySourceFileIds(sourceId, sourceFileIds) {
    if (!sourceFileIds.length) {
      return [];
    }
    return DB.prepare(
      `SELECT * FROM file WHERE source_id = ? AND source_file_id IN (${sourceFileIds.map(() => '?').join(',')})`
    )
      .all(sourceId, sourceFileIds)
      .map((f) => toGalleryFileModel(f));
  },
  // monthDay: 'MM-DD'. Matches files taken on that month/day in any year, as
  // long as that occurrence is strictly before beforeDate (excludes today/future).
  findOnMonthDayBefore(monthDay, beforeDate) {
    /**
     * date is stored in epoch milliseconds, but strftime's 'unixepoch' modifier
     * expects epoch seconds, hence the / 1000. '%m-%d' then extracts just the
     * month and day (dropping the year) so this matches across every year at once.
     * The 'localtime' modifier matters: without it, strftime extracts the
     * month/day in UTC, while `monthDay`/`beforeDate` are computed from the
     * server's local time (dayjs()) by the caller. For any non-UTC server
     * timezone, that mismatch lets a photo from just a few hours ago (still
     * "today" locally but already "tomorrow" in UTC, or vice versa) get
     * miscategorized as matching today's local month/day.
     */
    return DB.prepare(
      `SELECT * FROM file
       WHERE strftime('%m-%d', date / 1000, 'unixepoch', 'localtime') = ?
         AND date < ?
       ORDER BY date DESC`
    )
      .all(monthDay, beforeDate)
      .map((f) => toGalleryFileModel(f));
  },
  // Uniform-random pick of one file, among sourceIds, the given user hasn't
  // explored yet. Count-then-offset (rather than ORDER BY RANDOM()) so it
  // stays an index scan instead of a full-table sort.
  findRandomUnexplored(userId, sourceIds) {
    if (!sourceIds.length) {
      return null;
    }

    const placeholders = sourceIds.map(() => '?').join(',');
    const unexploredInSources = `
      FROM file f
      LEFT JOIN user_explore_history ueh
        ON f.source_id = ueh.source_id AND f.source_file_id = ueh.source_file_id AND ueh.user_id = ?
      WHERE ueh.id IS NULL AND f.source_id IN (${placeholders})
    `;

    const { count } = DB.prepare(`SELECT COUNT(*) AS count ${unexploredInSources}`).get(userId, ...sourceIds);
    if (!count) {
      return null;
    }

    const offset = Math.floor(Math.random() * count);

    return toGalleryFileModel(
      DB.prepare(`SELECT f.* ${unexploredInSources} LIMIT 1 OFFSET ?`).get(userId, ...sourceIds, offset)
    );
  },
  // Deterministic pick among sourceIds for a given integer seed - the same
  // seed (e.g. derived from today's date) always returns the same file, so
  // callers get a stable "pick of the day" rather than a fresh random file
  // on every request. ORDER BY id makes the offset meaningful across calls.
  findRandomForSeed(seed, sourceIds) {
    if (!sourceIds.length) {
      return null;
    }

    const placeholders = sourceIds.map(() => '?').join(',');

    const { count } = DB.prepare(
      `SELECT COUNT(*) AS count FROM file WHERE source_id IN (${placeholders})`
    ).get(...sourceIds);
    if (!count) {
      return null;
    }

    const offset = seed % count;

    return toGalleryFileModel(
      DB.prepare(
        `SELECT * FROM file WHERE source_id IN (${placeholders}) ORDER BY id LIMIT 1 OFFSET ?`
      ).get(...sourceIds, offset)
    );
  },
};
