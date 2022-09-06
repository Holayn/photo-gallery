const yargs = require('yargs');

const SourceService = require('../services/source');

process.on('uncaughtException', (err) => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});

const args = process.argv.slice(2);
yargs(args)
  .wrap(null)
  .help('help')
  .config('config')
  .demandCommand(1, 'You need at least one command before moving on')
  .command('add-source', 'Add a new source for images/videos', {
    alias: {
      demand: true,
      description: 'Alias for source being added',
      type: 'string',
    },
    source: {
      demand: true,
      description: 'System filepath to the images/videos',
      type: 'string',
    },
  }, async (options) => {
    const message = await SourceService.addSource(options.source, options.alias);
    console.log(`Message: ${message}`);
  })
  .command('sync-source', 'Sync a source\'s images/videos', {
    alias: {
      demand: true,
      description: 'Alias for source being synced',
      type: 'string',
    },
    force: {
      description: 'Force update',
      type: 'boolean',
    }
  }, async (options) => {
    const message = await SourceService.syncSource(options.alias, options.force);
    console.log(`Message: ${message}`);
  })
  .command('remove-source', 'Remove a source', {
    alias: {
      demand: true,
      description: 'Alias for source being removed',
      type: 'string',
    },
  }, (options) => {
    const message = SourceService.deleteSource(options.alias);
    console.log(`Message: ${message}`);
  })
  .argv;
