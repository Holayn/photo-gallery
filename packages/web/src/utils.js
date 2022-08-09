export function isVideo(photo) {
  return photo.metadata.File.MIMEType.includes('video');
}
