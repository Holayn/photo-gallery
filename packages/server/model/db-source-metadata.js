const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

dayjs.extend(customParseFormat);

// mime type for videos
const MIME_VIDEO_REGEX = /^video\/.*$/;

// standard EXIF date format, which is different from ISO8601
const EXIF_DATE_FORMAT = "YYYY:MM:DD HH:mm:ss";

class DbSourceMetadata {
  constructor(exif) {
    this.date = getDate(exif);
    this.video = video(exif);
    const size = dimensions(exif);
    this.width = size.width;
    this.height = size.height;
    this.orientation = tagValue(exif, "EXIF", "Orientation");
    this.appleLivePhoto = !!tagValue(exif, "QuickTime", "LivePhotoAuto");
    this.fileSize = tagValue(exif, "File", "FileSize");
    this.fileName = tagValue(exif, "File", "FileName");
    this.location = getLocation(exif);
    this.device = getDevice(exif);
  }
}

function getDate(exif) {
  // first, check if there's a valid date in the metadata
  const metadate = getMetaDate(exif);
  if (metadate) return metadate.valueOf();
  // otherwise, fallback to the last modified date
  return dayjs(exif.File.FileModifyDate, EXIF_DATE_FORMAT).valueOf();
}

function getMetaDate(exif) {
  const date =
    tagValue(exif, "EXIF", "DateTimeOriginal") ||
    tagValue(exif, "H264", "DateTimeOriginal") ||
    tagValue(exif, "QuickTime", "ContentCreateDate") ||
    tagValue(exif, "QuickTime", "CreationDate") ||
    tagValue(exif, "QuickTime", "CreateDate");
  if (date) {
    const parsed = dayjs(date, EXIF_DATE_FORMAT);
    if (parsed.isValid()) return parsed;
  }
  return null;
}

function getLocation(exif) {
  const altitudeVal = tagValue(exif, "EXIF", "GPSAltitude");
  if (altitudeVal) {
    const [altNum, altUnit] = altitudeVal.split(" ");
    const latRef = tagValue(exif, "EXIF", "GPSLatitudeRef");
    const longRef = tagValue(exif, "EXIF", "GPSLongitudeRef");
    const latVal = tagValue(exif, "EXIF", "GPSLatitude");
    const longVal = tagValue(exif, "EXIF", "GPSLongitude");
    const lat = latRef === "North" ? latVal : -1 * latVal;
    const long = longRef === "East" ? latVal : -1 * longVal;

    return {
      lat,
      long,
      altitude: `${Math.round(altNum)}${altUnit} ${tagValue(
        exif,
        "EXIF",
        "GPSAltitudeRef"
      )}`,
    };
  }
  return {
    unknown: true,
  };
}

function getDevice(exif) {
  return (
    tagValue(exif, "EXIF", "HostComputer") || tagValue(exif, "EXIF", "Model")
  );
}

function video(exif) {
  return MIME_VIDEO_REGEX.test(exif.File.MIMEType);
}

function tagValue(exif, type, name) {
  if (!exif[type]) return null;
  return exif[type][name];
}

function dimensions(exif) {
  // Use the Composite field to avoid having to check all possible tag groups (EXIF, QuickTime, ASF...)
  if (!exif.Composite || !exif.Composite.ImageSize) {
    return {
      width: null,
      height: null,
    };
  }
  const size = exif.Composite.ImageSize;
  const x = size.indexOf("x");
  return {
    width: parseInt(size.substr(0, x), 10),
    height: parseInt(size.substr(x + 1), 10),
  };
}

module.exports = DbSourceMetadata;
