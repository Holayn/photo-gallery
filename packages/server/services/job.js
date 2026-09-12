const cron = require('node-cron');
const logger = require('./logger');
const { PushSubscriptionDAO, UserDAO, UserSourceDAO } = require('./db');
const { getMemories } = require('./memories');
const { sendToSubscriptions } = require('./push-notification');

// Notify of memories 10 AM.
cron.schedule('0 10 * * *', async () => {
  try {
    logger.info('Sending push notifications');

    let memories;
    try {
      memories = getMemories();
    } catch (err) {
      logger.error('Failed to load memories, skipping notifications', err);
      return;
    }

    const sourceIds = [...new Set(
      memories.years.flatMap((year) => year.files.map((file) => file.sourceId))
    )];

    if (!sourceIds.length) {
      return;
    }

    const sourceToUserIds = {};
    UserSourceDAO.findAll().forEach(us => {
      if (!sourceToUserIds[us.sourceId]) {
        sourceToUserIds[us.sourceId] = [];
      }
      sourceToUserIds[us.sourceId].push(us.userId);
    });

    const users = UserDAO.findAll().reduce((acc, user) => {
      acc[user.id] = {
        subscriptions: PushSubscriptionDAO.findByUserId(user.id),
        files: [],
      }
      return acc;
    }, {});

    memories.years.forEach(year => {
      year.files.forEach(file => {
        const userIds = sourceToUserIds[file.sourceId];
        if (!userIds) {
          return;
        }

        userIds.forEach(userId => {
          users[userId].files.push(file);
        });
      });
    });

    const pushPromises = [];

    Object.values(users).forEach(({ subscriptions, files }) => {
      if (!files.length) {
        return;
      }

      const payload = JSON.stringify({
        title: 'New Memories Available!',
        body: `${files.length} ${files.length > 1 ? 'photos' : 'photo'} from this day in previous years.`,
        icon: '/icon-192x192.png'
      });

      pushPromises.push(sendToSubscriptions(subscriptions, payload));
    });

    await Promise.all(pushPromises);
  } catch (err) {
    logger.error('Failed to run memory notification job', err, true);
  }
});