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
     */
    return DB.prepare(
      `SELECT * FROM file
       WHERE strftime('%m-%d', date / 1000, 'unixepoch') = ?
         AND date < ?
       ORDER BY date DESC`
    )
      .all(monthDay, beforeDate)
      .map((f) => toGalleryFileModel(f));
  },
};
