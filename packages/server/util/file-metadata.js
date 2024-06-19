class FileMetadata {
  constructor({
    date,
    video,
    orientation,
    width,
    height,
    appleLivePhoto,
    fileSize,
    fileName,
    location,
    device,
    duration,
  }) {
    this.date = date;
    this.video = video;
    this.orientation = orientation;
    this.width = width;
    this.height = height;
    this.appleLivePhoto = appleLivePhoto;
    this.fileSize = fileSize;
    this.fileName = fileName;
    this.location = location;
    this.device = device;

    // Normalize this.
    // Can come as: 0:01:11 or 1.63 s
    this.duration = normalizeDuration(duration);

    if (orientation === 'Rotate 90 CW' && this.width > this.height) {
      this.width = height;
      this.height = width;
    }
  }
}

function normalizeDuration(duration) {
  if (duration) {
    if (duration.includes('s')) {
      const numericPart = duration.replace(/\s+/g, '');
      const seconds = parseFloat(numericPart);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
    }
    if (duration.includes(':')) {
      return duration;
    }
  }

  return null;
}

module.exports = FileMetadata;
