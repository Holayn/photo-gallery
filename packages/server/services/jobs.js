const CronJob = require('cron').CronJob;

const Collection = require('../services/collection');

module.exports = {
  run() {
    new CronJob('*/5 * * * *', () => {
      // TODO: log levels
      console.log('Job: Syncing sources.');
      new Collection().syncSources();
    }).start();
  }
}
