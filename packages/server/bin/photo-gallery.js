const yargs = require('yargs');

const { filesMoved } = require('../services/files-moved');
const logger = require('../services/logger');
const { indexMemories } = require('../services/memories');

logger.init();

const SourceService = require('../services/source');

process.on('uncaughtException', (err) => {
  logger.error('Unexpected error:', err);
  process.exit(1);
});

const args = process.argv.slice(2);

yargs(args)
  .help('help')
  .config('config')
  .demandCommand(1, 'You need at least one command before moving on')
  .command(
    'add-source',
    'Add a new source for images/videos',
    {
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
    },
    async (options) => {
      await SourceService.addSource(options.source, options.alias);
    }
  )
  .command(
    'sync-source',
    'Update files with the latest source info.',
    {
      alias: {
        demand: true,
        description: 'Alias for source being synced',
        type: 'string',
      },
    },
    async (options) => {
      await SourceService.syncSource(options.alias);
    }
  )
  .command(
    'remove-source',
    'Remove a source',
    {
      alias: {
        demand: true,
        description: 'Alias for source being removed',
        type: 'string',
      },
    },
    (options) => {
      SourceService.deleteSource(options.alias);
    }
  )
  .command(
    'files-moved',
    'Update the source id and file id of files when they get moved',
    {
      from: {
        demand: true,
        description: 'Alias for the from source',
        type: 'string',
      },
      to: {
        demand: true,
        description: 'Alias for the to source',
        type: 'string',
      },
    },
    (options) => {
      filesMoved(options.from, options.to);
    }
  )
  .command(
    'index-memories',
    'Create memories index',
    {},
    () => {
      console.log('Creating memories index...');
      indexMemories();
      console.log('Memories index created successfully');
    }
  ).argv;
