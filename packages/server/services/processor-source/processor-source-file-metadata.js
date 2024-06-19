const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/customParseFormat'));

const DATE_FORMAT = 'YYYY:MM:DD HH:mm:ss';
const MIME_VIDEO_REGEX = /^video\/.*$/;

class ProcessorSourceFileMetadata {
  constructor(exif) {
    this.date = getDate(exif);
    this.video = isVideo(exif);
    const size = getDimensions(exif);
    this.width = size.width;
    this.height = size.height;
    this.orientation = exif.EXIF?.Orientation;
    this.appleLivePhoto = !!exif.QuickTime?.LivePhotoAuto;
    this.fileSize = exif.File?.FileSize;
    this.fileName = exif.File?.FileName;
    this.location = getLocation(exif);
    this.device = getDevice(exif);
    this.duration = exif.QuickTime?.Duration;
  }
}

function getDate(exif) {
  const date =
    exif.EXIF?.DateTimeOriginal ||
    exif.H264?.DateTimeOriginal ||
    exif.QuickTime?.ContentCreateDate ||
    exif.QuickTime?.CreationDate ||
    exif.QuickTime?.CreateDate ||
    exif.XMP?.CreateDate ||
    exif.XMP?.DateCreated;
  if (date && dayjs(date, DATE_FORMAT).isValid()) {
    return dayjs(date, DATE_FORMAT).format(DATE_FORMAT);
  }
  return dayjs(exif.File.FileModifyDate, DATE_FORMAT).format(DATE_FORMAT);
}

function getLocation(exif) {
  const altitudeVal = exif.EXIF?.GPSAltitude;
  if (altitudeVal) {
    const [altNum, altUnit] = altitudeVal.split(' ');
    const latRef = exif.EXIF?.GPSLatitudeRef;
    const longRef = exif.EXIF?.GPSLongitudeRef;
    const latVal = exif.EXIF?.GPSLatitude;
    const longVal = exif.EXIF?.GPSLongitude;
    const lat = latRef === 'North' ? latVal : -1 * latVal;
    const long = longRef === 'East' ? latVal : -1 * longVal;

    return {
      lat,
      long,
      altitude: `${Math.round(altNum)}${altUnit} ${
        exif.EXIF?.GPSAltitudeRef || ''
      }`,
    };
  }
  return {
    unknown: true,
  };
}

function getDevice(exif) {
  return exif.EXIF?.HostComputer || exif.EXIF?.Model;
}

function isVideo(exif) {
  return MIME_VIDEO_REGEX.test(exif.File?.MIMEType);
}

function getDimensions(exif) {
  // Use the Composite field to avoid having to check all possible tag groups (EXIF, QuickTime, ASF...)
  if (!exif.Composite || !exif.Composite.ImageSize) {
    return {
      width: null,
      height: null,
    };
  }
  const size = exif.Composite.ImageSize;
  const x = size.indexOf('x');
  return {
    width: parseInt(size.substr(0, x), 10),
    height: parseInt(size.substr(x + 1), 10),
  };
}

module.exports = ProcessorSourceFileMetadata;
