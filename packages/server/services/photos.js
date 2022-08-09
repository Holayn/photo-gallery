const SIZES = {
  large: 'processed_path_large',
  original: 'processed_path_original',
  small: 'processed_path_small',
}

exports.sizes = SIZES;

exports.filesToPhotos = (files) => {
  const ret = files
  // don't include files that weren't processed
  .filter(f => f.processed_path_small && f.processed_path_large && f.processed_path_original)
  .map(f => {
    return {
      id: f.id,
      timestamp: f.file_timestamp,
      metadata: JSON.parse(f.metadata),
    }
  });

  ret.sort((a, b) => {
    return a.timestamp - b.timestamp;
  });

  return ret;
}
