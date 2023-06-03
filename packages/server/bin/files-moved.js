const File = require('../model/file');
const Source = require('../model/source');
const DbSource = require('../services/db-source');

/**
 * Go through file table - for every fromSource file, check to see if its sourceFileId still
 * exists in that source. If it doesn't, see if it got moved to the toSource, and if it did, make updates.
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
      if (!fromDbSourceFile) {
        const matchingToDbSourceFiles = toDbSource.findFilesMatching(f.sourceFileId);
        if (matchingToDbSourceFiles.length === 1) {
          console.log(`Updating - from: ${f.sourceFileId} in ${fromSource.alias} - to: ${matchingToDbSourceFiles[0].path} in ${toSource.alias}`);
          File.update({
            ...f,
            sourceId: toSource.id,
            sourceFileId: matchingToDbSourceFiles[0].path,
          });
        }
      }
    });
  }
}

module.exports = {
  filesMoved,
}