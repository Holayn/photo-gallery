# photo-gallery-server

Express.js API server backed by SQLite. Serves photo/video metadata and files.

Authentication is handled by the [`kaiauth`](../auth/README.md) package, which manages its own SQLite database for users, 2FA, and sessions.

## Configuration

Copy `sample.env` to `.env`:

| Variable                 | Description                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATA_DIR`               | **Required.** Root path where app data is stored (database, auth data, memories index)                                                                                                                                                           |
| `FILES_PATH`             | **Required.** Root path where processed photo/video files are stored. This is the directory nginx should `alias` in its internal `/files/` location                                                                                              |
| `WEB_IMG_TOOL_PATH`      | **Required.** Path to a local [webimg](https://github.com/Holayn/webimg) checkout. Used to process raw photo directories into sources created via the web app's "Create" button, by running `npm run start -- --config <path>` in this directory |
| `SESSION_SECRET`         | **Required.** Secret for signing session cookies                                                                                                                                                                                                 |
| `ENV`                    | `development` or `production`                                                                                                                                                                                                                    |
| `PORT`                   | Port to listen on (default: `8000`)                                                                                                                                                                                                              |
| `BASE_URL`               | Public base URL of the server                                                                                                                                                                                                                    |
| `NOTIFY_URL`             | Webhook URL for notifications. **Required in production**                                                                                                                                                                                        |
| `DISABLE_NGINX_REDIRECT` | Set to `true` if not behind nginx                                                                                                                                                                                                                |
| `DISCORD_BOT_TOKEN`      | **Required in production.** Bot token used by `kaiauth` for Discord-based notifications                                                                                                                                                          |
| `VAPID_PUBLIC_KEY`       | **Required in production.** VAPID public key for web push notifications, generated via `yarn generate-vapid-keys`. Must also be set as `PUBLIC_VAPID_KEY` in the web app                                                                         |
| `VAPID_PRIVATE_KEY`      | **Required in production.** VAPID private key for web push notifications, generated via `yarn generate-vapid-keys`                                                                                                                               |
| `VAPID_EMAIL`            | **Required in production.** Contact email sent as the `mailto:` subject with push notifications                                                                                                                                                  |

## Scripts

```sh
yarn start          # Production
yarn dev            # Development (nodemon + inspector)
yarn index-memories # Rebuild memories index
yarn generate-vapid-keys # For PWA push notification support
```

## CLI (`bin/photo-gallery.js`)

```sh
node bin/photo-gallery.js <command> [options]
```

| Command          | Options                             | Description                                            |
| ---------------- | ----------------------------------- | ------------------------------------------------------ |
| `add-source`     | `--alias <name> --source <path>`    | Register a new photo/video source directory            |
| `sync-source`    | `--alias <name>`                    | Sync a source with its latest files on disk            |
| `remove-source`  | `--alias <name>`                    | Remove a source and its associated data                |
| `files-moved`    | `--from <alias> --to <alias>`       | Update file references when files move between sources |
| `index-memories` |                                     | Rebuild the memories index                             |
| `add-user`       | `--username <name> --password <pw>` | Add a user (overwrites if already exists)              |
