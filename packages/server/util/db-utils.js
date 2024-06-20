function camelizeRecord(record) {
  if (!record) {
    return null;
  }

  return Object.keys(record).reduce((acc, key) => {
    const camelizedKey = key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    acc[camelizedKey] = record[key];
    return acc;
  }, {});
}

function toModelFactory(Class) {
  return (record) => {
    if (record) {
      return new Class(camelizeRecord(record));
    }

    return null;
  };
}

module.exports = {
  toModelFactory,
};
