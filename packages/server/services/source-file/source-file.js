const { baseUrl } = require('../config');
const { PHOTO_SIZES } = require('../../constants/photo');

function photoUrl(sourceId, sourceFileId, size) {
  return `${baseUrl}/api/photo?sourceId=${sourceId}&sourceFileId=${sourceFileId}&size=${size}`;
}

function downloadUrl(sourceId, sourceFileId) {
  return `${baseUrl}/api/photo/download?sourceId=${sourceId}&sourceFileId=${sourceFileId}`;
}

/**
 * A file represented in the app: the webimg-processed file (the source of truth for
 * what it is) joined with the gallery's own bookkeeping about it (share token,
 * processing state, album membership). Built only by SourceFileService, which
 * does the lookups in bulk; everything else gets one from there rather than
 * assembling its own.
 */
class SourceFile {
  // `processorFile`: ProcessorSourceFile, `galleryFile`: GalleryFile.
  // `albums`: null when album membership wasn't loaded, otherwise the albums visible to the requesting user.
  // `urlParams`: extra query string (e.g. '&id=..&token=..') appended to view/download urls, for access via a shared album.
  constructor({ sourceId, processorFile, galleryFile, albums = null, urlParams = '' }) {
    this.sourceId = sourceId;
    this.processorFile = processorFile;
    this.galleryFile = galleryFile;
    this.albums = albums;
    this.urlParams = urlParams;
  }

  get sourceFileId() {
    return this.processorFile.id;
  }

  get galleryFileId() {
    return this.galleryFile.id;
  }

  get date() {
    return this.processorFile.date;
  }

  get metadata() {
    return this.processorFile.metadata;
  }

  get createdAt() {
    return this.processorFile.createdAt;
  }

  get previewOnly() {
    return this.processorFile.previewOnly;
  }

  get processing() {
    return this.galleryFile.processing;
  }

  get token() {
    return this.galleryFile.token;
  }

  get urls() {
    const { sourceId, sourceFileId } = this;
    return {
      view: Object.values(PHOTO_SIZES).reduce((acc, size) => {
        acc[size] = photoUrl(sourceId, sourceFileId, size) + this.urlParams;
        return acc;
      }, {}),
      download: downloadUrl(sourceId, sourceFileId) + this.urlParams,
    };
  }

  get shareUrl() {
    return this.token ? `${photoUrl(this.sourceId, this.sourceFileId, PHOTO_SIZES.FULL)}&token=${this.token}` : null;
  }

  toStatus() {
    return {
      sourceId: this.sourceId,
      sourceFileId: this.sourceFileId,
      previewOnly: this.previewOnly,
      processing: this.processing,
    };
  }

  // `albums` is only present when it was actually loaded,
  // so an absent key never gets mistaken for "in no albums".
  toJSON() {
    return {
      sourceId: this.sourceId,
      sourceFileId: this.sourceFileId,
      galleryFileId: this.galleryFileId,
      date: this.date,
      metadata: this.metadata,
      createdAt: this.createdAt,
      previewOnly: this.previewOnly,
      processing: this.processing,
      urls: this.urls,
      shareUrl: this.shareUrl,
      ...(this.albums && { albums: this.albums }),
    };
  }
}

module.exports = SourceFile;
