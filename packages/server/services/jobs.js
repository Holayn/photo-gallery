const CronJob = require('cron').CronJob;

const SourceService = require('../services/source');

module.exports = {
  run() {
    new CronJob('*/15 * * * *', () => {
      // TODO: log levels
      console.log('Job: Syncing sources.');
      SourceService.syncSources();
    }).start();
  }
}
