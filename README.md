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

## Reprocessing sources

A source created via the "Create" flow (not the `add-source` CLI command above, which never records an input path to reprocess from) can be reprocessed after creation, from its page in the web app (⋮ menu next to the source name):

- **Run photo processessing** — re-runs webimg against the source's original input directory right away, picking up any files added since the last run. Only available for sources with a known input path (i.e. created via "Create", not added via the `add-source` CLI).
- **Continuous Processing** — a per-source toggle that watches the source's input directory and reprocesses it automatically a short while after new files stop arriving, with no manual trigger needed. Off by default; only enable it for sources that are actually expected to keep receiving new files, since watching a directory has a real ongoing cost.

While a source is processing (manually or automatically triggered), the app shows a loading indicator — inline next to the heading on the source's own page, and per-source on the Sources list page. A notification is sent (via the configured `NOTIFY_URL`) when a source starts and finishes processing.

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