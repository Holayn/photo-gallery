const File = require('../model/file');
const Source = require('../model/source');
const DbSource = require('./db-source');

/**
 * Look up fromSource file to see if there's a matching file in the toSource.
 * Match on file_name and file_date.
 * If match, update source and id.
 * @param {*} fromSourceId 
 * @param {*} toSourceId 
 * @param {*} sourceFileIdConverter 
 */
function filesMoved(fromSourceAlias, toSourceAlias) {
  const fromSource = Source.getSourceByAlias(fromSourceAlias);
  const toSource = Source.getSourceByAlias(toSourceAlias);
  if (fromSource && toSource) {
    const fromDbSource = new DbSource(fromSource);
    const toDbSource = new DbSource(toSource);

    const filesFromSource = File.findBySourceId(fromSource.id);

    filesFromSource.forEach((f) => {
      const fromDbSourceFile = fromDbSource.getFile(f.sourceFileId);
      if (fromDbSourceFile) {
        const matchingToDbSourceFile = toDbSource.findFilesMatching(fromDbSourceFile)[0];
        if (matchingToDbSourceFile) {
          console.log(`Updating - from: ${f.sourceFileId} in ${fromSource.alias} - to: ${matchingToDbSourceFile.path} in ${toSource.alias}`);
          File.update({
            ...f,
            sourceId: toSource.id,
            sourceFileId: matchingToDbSourceFile.id,
          });
        }
      }
    });
  }
}

module.exports = {
  filesMoved,
}