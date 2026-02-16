const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { SourceDAO } = require('./db');
const ProcessorSource = require('./processor-source/processor-source');

const MEMORIES_INDEX_PATH = path.join(__dirname, '../memories.json');

let memoriesIndex = {};

function getMemoriesIndex() {
  if (fs.existsSync(MEMORIES_INDEX_PATH)) {
    memoriesIndex = JSON.parse(fs.readFileSync(MEMORIES_INDEX_PATH, 'utf8'));
  } else {
    throw new Error('Memories index not found');
  }

  return memoriesIndex;
}

function saveMemoriesIndex(memoriesIndex) {
  fs.writeFileSync(MEMORIES_INDEX_PATH, JSON.stringify(memoriesIndex, null, 2));
}

function indexMemories() {
  const memoriesIndex = {
    years: [],
  };

  const lastYear = dayjs().subtract(1, 'year').year();

  const sources = SourceDAO.findAll();

  sources.forEach(source => {
    const processorSource = new ProcessorSource(source);
    const earliest = processorSource.findEarliest();
    const earliestYear = dayjs(earliest.date).year();

    const start = dayjs().startOf('day');
    const end = dayjs().endOf('day');

    for (let year = earliestYear; year <= lastYear; year++) {
      const startOfDay = start.year(year);
      const endOfDay = end.year(year);

      const files = processorSource.findBetweenDates(startOfDay.valueOf(), endOfDay.valueOf());
      if (!files.length) {
        continue;
      }

      let memoryIndexYear = memoriesIndex.years.find(i => i.year === year);
      if (!memoryIndexYear) {
        memoryIndexYear = {
          year,
          files: [],
        };
        memoriesIndex.years.push(memoryIndexYear);
      }

      memoryIndexYear.files.push(...files.map(f => ({
        id: f.id,
        sourceId: source.id,
      })));
    }
  });

  memoriesIndex.years.sort((a, b) => b.year - a.year);

  saveMemoriesIndex(memoriesIndex);
}

module.exports = {
  indexMemories,
  getMemoriesIndex,
};