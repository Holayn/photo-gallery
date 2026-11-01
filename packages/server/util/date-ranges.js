const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/customParseFormat'));

const DATE_FORMAT = 'YYYY-MM-DD';
const RANGE_DELIMITER = ':';
const RANGES_DELIMITER = ';';

// Mirrors webimg's own validation (src/date-ranges.ts), so bad ranges are
// rejected when saved rather than failing the next processing run.
function validateDateRange(range) {
  if (typeof range !== 'string') {
    throw new Error('Date range must be a string.');
  }

  const parts = range.split(RANGE_DELIMITER);
  if (parts.length !== 2) {
    throw new Error(`Invalid date range "${range}" - expected ${DATE_FORMAT}${RANGE_DELIMITER}${DATE_FORMAT}.`);
  }

  const [start, end] = parts.map((value) => {
    // Strict parsing rejects both malformed strings and impossible dates (e.g. 2026-02-30).
    const date = dayjs(value, DATE_FORMAT, true);
    if (!date.isValid()) {
      throw new Error(`Invalid date "${value}" in date range "${range}" - expected ${DATE_FORMAT}.`);
    }
    return date;
  });

  if (start.isAfter(end)) {
    throw new Error(`Invalid date range "${range}" - start is after end.`);
  }
}

function serializeDateRanges(ranges) {
  return ranges.length ? ranges.join(RANGES_DELIMITER) : null;
}

function deserializeDateRanges(value) {
  return value ? value.split(RANGES_DELIMITER) : [];
}

module.exports = {
  validateDateRange,
  serializeDateRanges,
  deserializeDateRanges,
};
