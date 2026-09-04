const cron = require('node-cron');
const webpush = require('web-push');
const logger = require('./logger');
const { vapidPublicKey, vapidPrivateKey, vapidEmail } = require('./config');
const { PushSubscriptionDAO, UserDAO, UserSourceDAO } = require('./db');
const { getMemoriesIndex, indexMemories } = require('./memories');

// Configure VAPID
webpush.setVapidDetails(
  `mailto:${vapidEmail}`,
  vapidPublicKey,
  vapidPrivateKey,
);

// Schedule daily memory indexing at 12 AM
cron.schedule('0 0 * * *', () => {
  try {
    logger.info('Running daily memory index...');
    indexMemories();
    logger.info('Memories index created successfully');
  } catch (err) {
    logger.error('Failed to run daily memory index job', err, true);
  }
});

// Notify of memories 10 AM.
cron.schedule('0 10 * * *', async () => {
  try {
    logger.info('Sending push notifications');

    let memoriesIndex;
    try {
      memoriesIndex = getMemoriesIndex();
    } catch (err) {
      logger.error('Failed to load memories index, skipping notifications', err);
      return;
    }

    const sourceIds = [...new Set(
      memoriesIndex.years.flatMap((year) => year.files.map((file) => file.sourceId))
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

    memoriesIndex.years.forEach(year => {
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

      subscriptions.forEach(subscription => {
        pushPromises.push((async () => {
          try {
            await webpush.sendNotification(subscription.subscription, payload);
          } catch (err) {
            logger.error(`Failed to send push notification (subscription #${subscription.id})`, err);

            // Clean up expired / unsubscribed endpoints (HTTP 410 Gone or 404)
            if (err.statusCode === 410 || err.statusCode === 404) {
              PushSubscriptionDAO.deleteById(subscription.id);
            }
          }
        })());
      });
    });

    await Promise.all(pushPromises);
  } catch (err) {
    logger.error('Failed to run memory notification job', err, true);
  }
});