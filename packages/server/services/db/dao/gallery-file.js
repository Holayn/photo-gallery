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
};
