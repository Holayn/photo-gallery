# photo-gallery

A self-hosted photo gallery. Yarn monorepo with an Express server (`packages/server`) and a Vue 3 web app (`packages/web`).

## Requirements

- Node.js, Yarn
- A local checkout of [webimg](https://github.com/Holayn/webimg), pointed to by `WEB_IMG_TOOL_PATH` (see [server README](packages/server/README.md)) — the server uses it to process photo/video sources

## Setup

### 1. Install dependencies

```sh
yarn
```

### 2. Configure the server

Copy `packages/server/sample.env` to `packages/server/.env` and fill in the values (see [server README](packages/server/README.md)).

### 3. Add a source

For photos already processed by webimg:

```sh
node packages/server/bin/photo-gallery.js add-source --alias <name> --source <path>
```

Or use the "Create" button on the Sources page in the web app to point at a raw (unprocessed) photo directory — the server will run webimg for you and the source becomes available once processing finishes.

### 4. Add a user

```sh
node packages/server/bin/photo-gallery.js add-user --username <name> --password <password>
```

This inserts the user into both the auth database (managed by `kaiauth`) and the server's own user table. If the user already exists, it is overwritten.

## Development

```sh
yarn --cwd packages/server dev   # API server on :8000
yarn --cwd packages/web dev      # Vite dev server (proxies /api, /login, /auth → :8000)
```

## Production

```sh
yarn --cwd packages/web build    # Output to packages/web/dist
yarn --cwd packages/server start # Serves API; nginx (or similar) serves dist/
```