const yargs = require('yargs');
const Database = require('better-sqlite3');

const { filesMoved } = require('../services/files-moved');
const logger = require('../services/logger');
const { indexMemories } = require('../services/memories');
const { UserStore } = require('kaiauth');

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
  )
  .command(
    'add-user',
    'Add a new user (overwrites if already exists)',
    {
      username: {
        demand: true,
        description: 'Username for the new user',
        type: 'string',
      },
      password: {
        demand: true,
        description: 'Password for the new user',
        type: 'string',
      },
      'notify-user': {
        description: 'Notification identifier for notify service',
        type: 'string',
      },
    },
    (options) => {
      const { UserDAO } = require('../services/db');

      // Upsert into kaiauth's user table
      const db = new Database('./auth.db');
      const userStore = new UserStore(db);
      userStore.upsert({ username: options.username, password: options.password });
      db.close();

      // Upsert into the server's own user table
      UserDAO.upsert({ name: options.username, notifyUser: options.notifyUser });

      console.log(`User "${options.username}" added successfully.`);
    }
  ).argv;
