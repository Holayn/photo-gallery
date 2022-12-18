const DB = require('../services/db');

DB.exec('CREATE TABLE IF NOT EXISTS file (id INTEGER PRIMARY KEY, timestamp_added INTEGER, date INTEGER, metadata TEXT, source_id INTEGER, source_file_id TEXT, FOREIGN KEY(source_id) REFERENCES source(id))');

class File {
  constructor({ id, date, metadata, sourceId, sourceFileId }) {
    this.id = id;
    this.date = date;
    this.metadata = metadata;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
  }

  static insert(file) {
    const { lastInsertRowid } = DB.prepare(`INSERT INTO file (timestamp_added, date, metadata, source_id, source_file_id) VALUES (@timestampAdded, @date, @metadata, @sourceId, @sourceFileId)`)
      .run({
        date: file.date,
        metadata: JSON.stringify(file.metadata),
        sourceFileId: file.sourceFileId,
        sourceId: file.sourceId,
        timestampAdded: new Date().getTime(),
      });
    return lastInsertRowid;
  }

  static get(id) {
    const fileRecord = DB.prepare('SELECT * FROM file WHERE id = ?').get(id);
    return dbRecordToFile(fileRecord);
  }

  static delete(id) {
    DB.prepare('DELETE FROM file WHERE id = ?').run(id);
  }

  static findBySourceId(sourceId) {
    return DB.prepare('SELECT * FROM file WHERE source_id = ?').all(sourceId);
  }

  static getBySource(sourceId, sourceFileId) {
    const fileRecord = DB.prepare('SELECT * FROM file WHERE source_id = ? AND source_file_id = ?').get(sourceId, sourceFileId);
    if (fileRecord) {
      return dbRecordToFile(fileRecord);
    }
    return null;
  }

  static findByIds(fileIds, start, num) {
    return DB.prepare(`SELECT * FROM file WHERE id IN (${fileIds.join(', ')}) ORDER BY date LIMIT ?, ?`).all(start, num).map(f => dbRecordToFile(f));
  }
}

function dbRecordToFile(dbRecord) {
  return new File({
    id: dbRecord.id,
    date: dbRecord.date,
    metadata: JSON.parse(dbRecord.metadata),
    sourceFileId: dbRecord.source_file_id,
    sourceId: dbRecord.source_id,
  });
}

module.exports = File;