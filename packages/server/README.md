## Notes

- designate sources
- a source is a collection of some files to display in the gallery
- view all files across all sources in date order
  - find first n images
    - can't just query each source for first n images - a) too many images b) source A might have more images that come after source B's images
    - so we have to sync all image info from all sources and store that info

### DB

#### Tables
- source
  - id
  - alias
  - path

- file
  - id
  - date
  - metadata - only relevant bits, not everything the source has to offer
  - source_id
  - source_file_id - use this to retrieve the file from the source

- album
  - id
  - title

- album_file
  - album_id
  - file_id

  ### Source Requirements
  TODO

  ### Gallery Server API Requirements
  - serve up paginated list of all photo info
    - return file id, date, metadata
  - serve up a photo's small, large, and original sizes
    - example:
      - client makes request for large size of file #3
      - server looks up file #3... it uses its source_file_id to query source for file #3's large size file