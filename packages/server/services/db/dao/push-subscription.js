const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const PushSubscription = require('../../../model/push-subscription');

const toPushSubscriptionModel = toModelFactory(PushSubscription);

module.exports = {
  upsert({ userId, subscription }) {
    return DB.prepare(
      `INSERT INTO push_subscription (user_id, endpoint, subscription, created_at)
       VALUES (@userId, @endpoint, @subscription, @createdAt)
       ON CONFLICT(user_id, endpoint) DO UPDATE SET subscription = excluded.subscription`
    ).run({
      userId,
      endpoint: subscription.endpoint,
      subscription: JSON.stringify(subscription),
      createdAt: new Date().getTime(),
    }).lastInsertRowid;
  },
  findAll() {
    return DB.prepare('SELECT * FROM push_subscription')
      .all()
      .map((s) => toPushSubscriptionModel(s));
  },
  findByUserId(userId) {
    return DB.prepare('SELECT * FROM push_subscription WHERE user_id = ?')
      .all(userId)
      .map((s) => toPushSubscriptionModel(s));
  },
  deleteById(id) {
    return DB.prepare('DELETE FROM push_subscription WHERE id = ?').run(id).changes;
  },
};
