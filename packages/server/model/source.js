const { deserializeDateRanges } = require('../util/date-ranges');

class Source {
  id;
  alias;
  path;
  processed;
  filesPath;
  processing;
  continuous;
  updatedDate;
  skipVideoDateRanges;

  constructor({ id, alias, path, processed = true, filesPath, processing = false, continuous = false, updatedDate, skipVideoDateRanges = null }) {
    this.id = id;
    this.alias = alias;
    this.path = path;
    this.processed = Boolean(processed);
    this.filesPath = filesPath;
    this.processing = Boolean(processing);
    this.continuous = Boolean(continuous);
    this.updatedDate = updatedDate;
    this.skipVideoDateRanges = Array.isArray(skipVideoDateRanges) ? skipVideoDateRanges : deserializeDateRanges(skipVideoDateRanges);
  }
}

module.exports = Source;
