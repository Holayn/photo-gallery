const logger = require('../logger');
const CronJob = require('cron').CronJob;

const SourceService = require('../services/source');

module.exports = {
  run() {
    new CronJob('*/60 * * * *', () => {
      logger.info('Syncing sources.');
      try {
        SourceService.syncSources();
      } catch (e) {
        logger.error('Job failed.');
        logger.error(e);
      }
    }).start();

    logger.info('Job schedule started.');
  }
}
