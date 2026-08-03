const { generateRandomString } = require('../util/random');
const { GalleryFileDAO } = require('./db');
const SourceService = require('./source');
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
      const sourceFile = SourceService.getFile(sourceId, sourceFileId);
      GalleryFileDAO.insert(
        new GalleryFile({
          ...sourceFile,
          sourceId,
          token,
        })
      );
      return token;
    }
  }
}