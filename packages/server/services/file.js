const DB = require('./db');
const File = require('../model/file');

class FileService {
  constructor() {
    DB.exec('CREATE TABLE IF NOT EXISTS file (id INTEGER PRIMARY KEY, timestamp_added INTEGER, date INTEGER, metadata BLOB, source_id INTEGER, source_file_id TEXT, FOREIGN KEY(source_id) REFERENCES source(id))');
  }
  /**
   * @param {File} file 
   */
  addFile(file) {
    DB.prepare(`INSERT INTO file (timestamp_added, date, metadata, source_id, source_file_id) VALUES (@timestampAdded, @date, @metadata, @sourceId, @sourceFileId)`)
      .run({
        ...file,
        metadata: JSON.stringify(file.metadata),
        timestampAdded: new Date().getTime(),
      });
  }

  getFile(id) {
    const fileRecord = DB.prepare('SELECT * FROM file WHERE id = ?').get(id);
    return FileService.dbRecordToFile(fileRecord);
  }

  findAllFiles() {
    return DB.prepare('SELECT * FROM file').all().map(f => FileService.dbRecordToFile(f));
  }

  findFilesFrom(start, num) {
    return DB.prepare('SELECT * FROM file ORDER BY date DESC LIMIT ?, ?').all(start, num).map(f => FileService.dbRecordToFile(f));
  }

  findByFileIds(fileIds) {
    return DB.prepare(`SELECT * FROM file WHERE id IN (${fileIds.join(', ')})`).all().map(f => FileService.dbRecordToFile(f));
  }

  static dbRecordToFile(dbRecord) {
    return new File({
      ...dbRecord,
      sourceFileId: dbRecord.source_file_id,
      sourceId: dbRecord.source_id,
    });
  }
}

module.exports = new FileService();