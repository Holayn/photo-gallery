class PushSubscription {
  id;
  userId;
  subscription;
  createdAt;

  constructor({ id, userId, subscription, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.subscription = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
    this.createdAt = createdAt;
  }
}

module.exports = PushSubscription;
