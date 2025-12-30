const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/customParseFormat'));

const MIME_VIDEO_REGEX = /^video\/.*$/;

class ProcessorSourceFileMetadata {
  constructor(exif) {
    this.video = isVideo(exif);
    const size = getDimensions(exif);
    this.width = size.width;
    this.height = size.height;
    this.appleLivePhoto = !!exif.QuickTime?.LivePhotoAuto;
    this.fileSize = exif.File?.FileSize;
    this.fileName = exif.File?.FileName;
    this.location = getLocation(exif);
    this.device = getDevice(exif);
    this.duration = normalizeDuration(exif.QuickTime?.Duration);
  }
}

function getLocation(exif) {
  const altitudeVal = exif.EXIF?.GPSAltitude;
  if (altitudeVal) {
    const [altNum, altUnit] = typeof altitudeVal === 'string' ? altitudeVal.split(' ') : [altitudeVal, 'm'];
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
  const dimensions = {
    width: parseInt(size.substr(0, x), 10),
    height: parseInt(size.substr(x + 1), 10),
  };

  if (
    exif.EXIF?.Orientation === 'Rotate 90 CW' ||
    exif.EXIF?.Orientation === 'Rotate 270 CW' ||
    exif.Composite?.Rotation === 90 ||
    exif.Composite?.Rotation === 270 ||
    exif.Composite?.Rotation === 'Rotate 90 CW' ||
    exif.Composite?.Rotation === 'Rotate 270 CW'
  ) {
    return {
      width: dimensions.height,
      height: dimensions.width,
    };
  }

  return dimensions;
}

// Can come as: 0:01:11 or 1.63 s
function normalizeDuration(duration) {
  if (duration) {
    if (typeof duration === 'string') {
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
    } else {
      const seconds = parseFloat(duration);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
    }
  }

  return null;
}

module.exports = ProcessorSourceFileMetadata;
