const { SourceDAO, GalleryFileDAO } = require('./db');
const ProcessorSource = require('./processor-source/processor-source');

/**
 * Look up fromSource file to see if there's a matching file in the toSource.
 * Match on file_name and file_date.
 * If match, update source and id.
 * @param {*} fromSourceId
 * @param {*} toSourceId
 * @param {*} sourceFileIdConverter
 */
function filesMoved(fromSourceAlias, toSourceAlias) {
  const fromSource = SourceDAO.getSourceByAlias(fromSourceAlias);
  const toSource = SourceDAO.getSourceByAlias(toSourceAlias);
  if (fromSource && toSource) {
    const fromProcessorSource = new ProcessorSource(fromSource);
    const toProcessorSource = new ProcessorSource(toSource);

    const filesFromSource = GalleryFileDAO.findBySourceId(fromSource.id);

    filesFromSource.forEach((f) => {
      const fromFile = fromProcessorSource.getFile(f.sourceFileId);
      if (fromFile) {
        const matchingToFile = toProcessorSource.findFilesMatching(fromFile)[0];
        if (matchingToFile) {
          console.log(
            `Updating - from: ${f.sourceFileId} in ${fromSource.alias} - to: ${matchingToFile.path} in ${toSource.alias}`
          );
          GalleryFileDAO.update({
            ...f,
            sourceId: toSource.id,
            sourceFileId: matchingToFile.id,
          });
        }
      }
    });
  }
}

module.exports = {
  filesMoved,
};
