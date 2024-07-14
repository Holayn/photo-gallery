const crypto = require('crypto');

const SourceService = require('./source');

const { AlbumDAO, AlbumFileDAO, GalleryFileDAO, transaction } = require('./db');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const GalleryFile = require('../model/gallery-file');

const RANGE_QUERY_SIZE = 50;

module.exports = {
  createAlbum(name, files = {}) {
    transaction(() => {
      const albumId = AlbumDAO.insert(
        new Album({ name, token: generateAlbumToken() })
      );
      this.addToAlbum(albumId, files);
    })();
  },

  addToAlbum(albumId, files = {}) {
    transaction(() => {
      Object.keys(files).forEach((file) => {
        const f = files[file];
        const existingFile = GalleryFileDAO.getBySource(
          f.sourceId,
          f.sourceFileId
        );
        if (existingFile) {
          const existsInAlbum = AlbumFileDAO.getByAlbumIdFileId(
            albumId,
            existingFile.id
          );
          if (!existsInAlbum) {
            AlbumFileDAO.insert(
              new AlbumFile({ albumId, fileId: existingFile.id })
            );
          }
        } else {
          const sourceFile = SourceService.getFile(f.sourceId, f.sourceFileId);
          const newFileId = GalleryFileDAO.insert(
            new GalleryFile({
              ...sourceFile,
              sourceId: f.sourceId,
            })
          );
          AlbumFileDAO.insert(new AlbumFile({ albumId, fileId: newFileId }));
        }
      });
    })();
  },

  getAlbumFiles(id, start, num) {
    const albumFiles = AlbumFileDAO.findByAlbumId(id);
    const fileIds = albumFiles.map((f) => f.fileId);
    return GalleryFileDAO.findByIds(fileIds, start, num);
  },

  getAlbumFilesCoveringArea(
    albumId,
    start,
    imagePreviewHeight,
    imagePreviewArea
  ) {
    if (!imagePreviewArea || !imagePreviewHeight) {
      return null;
    }

    let usedArea = 0;
    const retFiles = [];
    let rangeStart = start;
    let hasMorePhotos = false;

    while (usedArea < imagePreviewArea) {
      const files = this.getAlbumFiles(albumId, rangeStart, RANGE_QUERY_SIZE)
        .map((f) => ({
          ...SourceService.getFile(f.sourceId, f.sourceFileId),
          sourceId: f.sourceId,
        }))
        .filter((f) => !!f.sourceFileId);

      for (const file of files) {
        retFiles.push(file);

        const { width: fileWidth, height: fileHeight } = file.metadata;

        if (!fileWidth || !fileHeight) {
          throw new Error('File is missing width/height metadata.');
        }

        const ratioFactor = fileHeight / imagePreviewHeight;
        const adjustedWidth = fileWidth / ratioFactor;
        usedArea += adjustedWidth * imagePreviewHeight;

        if (usedArea >= imagePreviewArea) {
          break;
        }
      }

      rangeStart += RANGE_QUERY_SIZE;

      hasMorePhotos = files.length >= RANGE_QUERY_SIZE;

      if (!hasMorePhotos) {
        break;
      }
    }

    return {
      info: {
        hasMorePhotos,
      },
      files: retFiles.map(
        ({ date, sourceId, sourceFileId = null, metadata }) => ({
          date,
          sourceId,
          sourceFileId,
          metadata,
        })
      ),
    };
  },
};

function generateAlbumToken() {
  return crypto.randomBytes(16).toString('hex');
}
