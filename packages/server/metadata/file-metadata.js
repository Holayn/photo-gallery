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

    if (orientation === "Rotate 90 CW" && this.width > this.height) {
      this.width = height;
      this.height = width;
    }
  }
}

module.exports = FileMetadata;
