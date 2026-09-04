class UserSource {
  id;
  userId;
  sourceId;

  constructor({ id, userId, sourceId }) {
    this.id = id;
    this.userId = userId;
    this.sourceId = sourceId;
  }
}

module.exports = UserSource;
