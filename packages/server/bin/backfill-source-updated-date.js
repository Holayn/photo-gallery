// One-time backfill for the source.updated_date column: sets it to the date
// of each source's latest processed file, since there's no processing
// history to derive an actual "last updated" timestamp from. Safe to delete
// after running once.
const fs = require('fs');

const logger = require('../services/logger');

logger.init();

const { SourceDAO } = require('../services/db');
const ProcessorSource = require('../services/processor-source/processor-source');

SourceDAO.findAll().forEach((source) => {
  if (!fs.existsSync(ProcessorSource.getFullDbPath(source.path))) {
    console.log(`${source.alias}: no index found, skipping.`);
    return;
  }

  const processorSource = new ProcessorSource(source);
  const latestFile = processorSource.findLatest();

  if (!latestFile) {
    console.log(`${source.alias}: no files found, skipping.`);
    return;
  }

  SourceDAO.touch(source.id, latestFile.date);
  console.log(`${source.alias}: updated_date set to ${latestFile.date}`);
});

console.log('Backfill complete.');
