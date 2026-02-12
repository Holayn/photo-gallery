const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/customParseFormat'));

const MIME_VIDEO_REGEX = /^video\/.*$/;

class ProcessorSourceFileMetadata {
  constructor(metadata) {
    this.video = isVideo(metadata);
    const size = getDimensions(metadata);
    this.width = size.width;
    this.height = size.height;
    this.appleLivePhoto = !!metadata.QuickTime?.LivePhotoAuto;
    this.fileSize = metadata.File?.FileSize;
    this.fileName = metadata.File?.FileName;
    this.location = getLocation(metadata);
    this.device = getDevice(metadata);
    this.duration = normalizeDuration(metadata.QuickTime?.Duration);
    this.timezone = metadata.WebImg?.Date?.timezone;
  }
}

function getLocation(metadata) {
  const altitudeVal = metadata.EXIF?.GPSAltitude;
  if (altitudeVal) {
    let altNum, altUnit, lat, long;
    const latRef = metadata.EXIF?.GPSLatitudeRef;
    const longRef = metadata.EXIF?.GPSLongitudeRef;
    const latVal = metadata.EXIF?.GPSLatitude;
    const longVal = metadata.EXIF?.GPSLongitude;

    if (typeof altitudeVal === 'string') {
      [altNum, altUnit] = altitudeVal.split(' ');
      lat = (latRef === 'North') ? latVal : -1 * latVal;
      long = (longRef === 'East') ? longVal : -1 * longVal;
    } else {
      altNum = altitudeVal;
      altUnit = 'm';
      lat = latVal;
      long = longVal;
    }

    return {
      lat,
      long,
      altitude: `${Math.round(altNum)}${altUnit} ${
        metadata.EXIF?.GPSAltitudeRef || ''
      }`,
    };
  }
  return {
    unknown: true,
  };
}

function getDevice(metadata) {
  return metadata.EXIF?.HostComputer || metadata.EXIF?.Model;
}

function isVideo(metadata) {
  return MIME_VIDEO_REGEX.test(metadata.File?.MIMEType);
}

function getDimensions(metadata) {
  // Use the Composite field to avoid having to check all possible tag groups (metadata, QuickTime, ASF...)
  if (!metadata.Composite || !metadata.Composite.ImageSize) {
    return {
      width: null,
      height: null,
    };
  }
  const size = metadata.Composite.ImageSize;
  const x = size.indexOf('x');
  const dimensions = {
    width: parseInt(size.substr(0, x), 10),
    height: parseInt(size.substr(x + 1), 10),
  };

  if (
    metadata.EXIF?.Orientation > 4 ||
    metadata.Composite?.Rotation === 90 ||
    metadata.Composite?.Rotation === 270
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
