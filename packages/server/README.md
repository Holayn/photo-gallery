# photo-gallery-server

Express.js API server backed by SQLite. Serves photo/video metadata and files.

## Configuration

Copy `sample.env` to `.env`:

| Variable               | Description                                              |
|------------------------|----------------------------------------------------------|
| `ENV`                  | `development` or `production`                            |
| `PORT`                 | Port to listen on (default: `8000`)                      |
| `SESSION_SECRET`       | **Required.** Secret for signing session cookies         |
| `BASE_URL`             | Public base URL of the server                            |
| `FILES_PATH`           | Root path where processed photo/video files are stored   |
| `NOTIFY_URL`           | Optional webhook URL for notifications                   |
| `DISABLE_NGINX_REDIRECT` | Set to `true` if not behind nginx                      |

## Scripts

```sh
yarn start          # Production
yarn dev            # Development (nodemon + inspector)
yarn index-memories # Rebuild memories index
```

## CLI (`bin/photo-gallery.js`)

```sh
node bin/photo-gallery.js <command> [options]
```

| Command         | Options                          | Description                                      |
|-----------------|----------------------------------|--------------------------------------------------|
| `add-source`    | `--alias <name> --source <path>` | Register a new photo/video source directory      |
| `sync-source`   | `--alias <name>`                 | Sync a source with its latest files on disk      |
| `remove-source` | `--alias <name>`                 | Remove a source and its associated data          |
| `index-memories`|                                  | Rebuild the memories index                       |
