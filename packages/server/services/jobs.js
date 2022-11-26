const logger = require('./logger');
const CronJob = require('cron').CronJob;

const SourceService = require('../services/source');

module.exports = {
  run() {
    new CronJob('*/15 * * * *', () => {
      logger.info('Syncing sources.');
      SourceService.syncSources();
    }).start();

    logger.info('Source sync job started.');
  }
}
