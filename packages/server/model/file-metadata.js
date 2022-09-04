class FileMetadata {
  constructor ({
    date,
    caption,
    keywords,
    people,
    video,
    animated,
    rating,
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
    this.width = width;
    this.height = height;
    this.appleLivePhoto = appleLivePhoto;
    this.fileSize = fileSize;
    this.fileName = fileName;
  }
}

module.exports = FileMetadata;