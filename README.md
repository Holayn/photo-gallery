# photo-gallery

## Setup

### Photos
1. Process photos with [photo-web-processor](https://github.com/Holayn/photo-web-processor).
2. Add a new source to the server via `add-source`.
    - e.g. `node packages/server/bin/photo-gallery.js add-source --alias SOURCE_NAME --source PATH`

### Server Setup
- Define `SESSION_SECRET` in `.env`
- Start the server, then add a user with a SHA256-hashed password to the `photo-gallery.db`

### Startup

#### Development

`yarn --cwd packages/server dev`

`yarn --cwd packages/web dev`