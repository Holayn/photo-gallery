const CronJob = require('cron').CronJob;

const SourceService = require('../services/source');

module.exports = {
  run() {
    new CronJob('*/5 * * * *', () => {
      // TODO: log levels
      console.log('Job: Syncing sources.');
      SourceService.syncSources();
    }).start();
  }
}
