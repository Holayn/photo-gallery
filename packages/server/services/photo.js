const { generateRandomString } = require('../util/random');
const { GalleryFileDAO } = require('./db');
const SourceFileService = require('./source-file');
const GalleryFile = require('../model/gallery-file');

module.exports = {
  share(sourceId, sourceFileId) {
    const existingFile = GalleryFileDAO.getBySource(
      sourceId,
      sourceFileId,
    );
    if (existingFile) {
      if (!existingFile.token) {
        existingFile.token = generateRandomString(72);
        GalleryFileDAO.update(existingFile);
      }
      return existingFile.token;
    } else {
      const token = generateRandomString(72);
      const sourceFile = SourceFileService.getFile(sourceId, sourceFileId);
      GalleryFileDAO.insert(
        new GalleryFile({
          date: sourceFile.date,
          sourceFileId,
          sourceId,
          token,
        })
      );
      return token;
    }
  }
}