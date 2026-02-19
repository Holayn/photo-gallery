# photo-gallery

A self-hosted photo gallery. Yarn monorepo with an Express server (`packages/server`) and a Vue 3 web app (`packages/web`).

## Requirements

- Node.js, Yarn
- Photos pre-processed by [webimg](https://github.com/Holayn/webimg)

## Setup

### 1. Install dependencies

```sh
yarn
```

### 2. Configure the server

Copy `packages/server/sample.env` to `packages/server/.env` and fill in the values (see [server README](packages/server/README.md)).

### 3. Add a source

```sh
node packages/server/bin/photo-gallery.js add-source --alias <name> --source <path>
```

### 4. Add a user

```sh
node packages/server/bin/photo-gallery.js add-user --username <name> --password <password>
```

This inserts the user into both the auth database (managed by `kaiauth`) and the server's own user table. If the user already exists, it is overwritten.

## Development

```sh
yarn --cwd packages/server dev   # API server on :8000
yarn --cwd packages/web dev      # Vite dev server (proxies /api → :8000)
```

## Production

```sh
yarn --cwd packages/web build    # Output to packages/web/dist
yarn --cwd packages/server start # Serves API; nginx (or similar) serves dist/
```