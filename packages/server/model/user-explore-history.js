class UserExploreHistory {
  id;
  userId;
  sourceId;
  sourceFileId;

  constructor({ id, userId, sourceId, sourceFileId }) {
    this.id = id;
    this.userId = userId;
    this.sourceId = sourceId;
    this.sourceFileId = sourceFileId;
  }
}

module.exports = UserExploreHistory;
