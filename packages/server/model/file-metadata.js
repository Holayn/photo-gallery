class FileMetadata {
  constructor ({
    date,
    caption,
    keywords,
    people,
    video,
    animated,
    rating,
    orientation,
    width,
    height,
    appleLivePhoto,
    fileSize,
    fileName,
  }) {
    this.date = date;
    this.caption = caption;
    this.keywords = keywords;
    this.people = people;
    this.video = video;
    this.animated = animated;
    this.rating = rating;
    this.orientation = orientation;
    this.width = width;
    this.height = height;
    this.appleLivePhoto = appleLivePhoto;
    this.fileSize = fileSize;
    this.fileName = fileName;

    if (orientation === 'Rotate 90 CW') {
      this.width = height;
      this.height = width;
    }
  }
}

module.exports = FileMetadata;