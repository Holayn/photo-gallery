const ProcessorSource = require('./processor-source/processor-source');

const { UserExploreHistoryDAO, SourceDAO, UserSourceDAO, findUnexploredFile } = require('./db');
const SourceService = require('./source');

function getNext(user) {
  const sources = SourceDAO.findAll().filter(source => UserSourceDAO.hasAccess(user.id, source.id));

  const histories = UserExploreHistoryDAO.getByUserId(user.id);
  const sourceFilesSeen = histories.reduce((acc, history) => {
    if (!acc[history.sourceId]) {
      acc[history.sourceId] = [];
    }
    acc[history.sourceId].push(history.sourceFileId);
    return acc;
  }, {});

  const sourceCounts = getSourceCounts(sources, sourceFilesSeen);
  const totalRemaining = sourceCounts.reduce((sum, s) => sum + s.remaining, 0);

  if (!totalRemaining) return null;

  // Weighted Random Choice — only consider sources with remaining files
  const nonEmptySources = sourceCounts.filter(sc => sc.remaining > 0);
  let target = Math.random() * totalRemaining;
  // Default to last non-empty source as fallback for floating-point edge cases
  let selectedSource = sources.find(s => s.id === nonEmptySources[nonEmptySources.length - 1].sourceId);
  for (const sourceCount of nonEmptySources) {
    target -= sourceCount.remaining;
    if (target <= 0) {
      selectedSource = sources.find(s => s.id === sourceCount.sourceId);
      break;
    }
  }

  const found = findUnexploredFile(ProcessorSource.getFullDbPath(selectedSource.path), user.id);

  if (found) {
    UserExploreHistoryDAO.insert({
      userId: user.id,
      sourceId: selectedSource.id,
      sourceFileId: found.id,
    });

    return SourceService.getFile(selectedSource.id, found.id);
  }

  return null;
}

function getSourceCounts(sources, sourceFilesSeen) {
  return sources.map((source) => {
    const processorSource = new ProcessorSource(source);
    const total = processorSource.count();
    const sourceSeen = sourceFilesSeen[source.id] || [];
    return {
      sourceId: source.id,
      total,
      remaining: total - sourceSeen.length,
    };
  });
}

module.exports = {
  getNext,
}
