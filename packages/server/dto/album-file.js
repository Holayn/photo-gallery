/**
 * One entry in an album's file listing: the album membership (when it was added)
 * joined with the file itself. `sourceFile` is a SourceFile, or null when the
 * file no longer exists in its source - a "broken" album link, which is still
 * listed so clients can tell which links need cleaning up.
 */
class AlbumFileDto {
  // `albumFile`: AlbumFile, `galleryFile`: GalleryFile, `sourceAlias`: alias of the file's source.
  constructor({ albumFile, galleryFile, sourceFile = null, sourceAlias }) {
    this.albumFile = albumFile;
    this.galleryFile = galleryFile;
    this.sourceFile = sourceFile;
    this.sourceAlias = sourceAlias;
  }

  get broken() {
    return !this.sourceFile;
  }

  // `createdAt` is when the file was added to the album, not when the photo was taken/created.
  toJSON() {
    const file = this.sourceFile
      ? this.sourceFile.toJSON()
      : { galleryFileId: this.galleryFile.id, sourceId: this.galleryFile.sourceId };

    return {
      ...file,
      sourceAlias: this.sourceAlias,
      createdAt: this.albumFile.createdAt,
    };
  }
}

module.exports = AlbumFileDto;
