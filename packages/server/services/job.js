const cron = require('node-cron');
const webpush = require('web-push');
const { vapidPublicKey, vapidPrivateKey, vapidEmail } = require('./config');
const { PushSubscriptionDAO, UserDAO, UserSourceDAO } = require('./db');
const { getMemoriesIndex } = require('./memories');

// Configure VAPID
webpush.setVapidDetails(
  `mailto:${vapidEmail}`,
  vapidPublicKey,
  vapidPrivateKey,
);

// Schedule daily memory indexing at 12 AM
cron.schedule('0 0 * * *', () => {
  console.log('Running daily memory index...');
  indexMemories();
  console.log('Memories index created successfully');
});

// Notify of memories 10 AM.
cron.schedule('0 10 * * *', async () => {
  console.log('Sending push notifications');

  let memoriesIndex;
  try {
    memoriesIndex = getMemoriesIndex();
  } catch (err) {
    console.error('Failed to load memories index, skipping notifications:', err);
    return;
  }

  const sourceIds = [...new Set(
    memoriesIndex.years.flatMap((year) => year.files.map((file) => file.sourceId))
  )];

  if (!sourceIds.length) {
    return;
  }

  const usersWithMemories = UserDAO.findAll().filter((user) =>
    sourceIds.some((sourceId) => UserSourceDAO.hasAccess(user.id, sourceId))
  );

  const subscriptions = usersWithMemories.flatMap((user) => PushSubscriptionDAO.findByUserId(user.id));

  if (!subscriptions.length) {
    return;
  }

  const payload = JSON.stringify({
    title: 'New Memories Available!',
    body: 'Check out your photos from this day in previous years.',
    icon: '/icon-192x192.png'
  });

  const pushPromises = subscriptions.map(async ({ id, subscription }) => {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      // Clean up expired / unsubscribed endpoints (HTTP 410 Gone or 404)
      if (err.statusCode === 410 || err.statusCode === 404) {
        PushSubscriptionDAO.deleteById(id);
      }
    }
  });

  await Promise.all(pushPromises);
});