const dayjs = require('dayjs');
const { GalleryFileDAO } = require('./db');

function getMemories() {
  const today = dayjs();
  const monthDay = today.format('MM-DD');
  const startOfToday = today.startOf('day').valueOf();

  const files = GalleryFileDAO.findOnMonthDayBefore(monthDay, startOfToday);

  const years = [];
  files.forEach((f) => {
    const year = dayjs(f.date).year();
    let memoryYear = years.find((y) => y.year === year);
    if (!memoryYear) {
      memoryYear = { year, files: [] };
      years.push(memoryYear);
    }
    memoryYear.files.push({ id: f.sourceFileId, sourceId: f.sourceId });
  });

  years.sort((a, b) => b.year - a.year);

  return { years };
}

module.exports = {
  getMemories,
};
