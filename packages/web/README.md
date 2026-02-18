# photo-gallery-web

Vue 3 + Vite frontend. Uses Pinia for state, Vue Router for navigation, and Tailwind CSS for styling.

## Scripts

```sh
yarn dev      # Dev server with HMR (proxies /api → :8000)
yarn build    # Production build → dist/
```

## Production

Serve the `dist/` output with nginx or another static file server. Point API requests at the running `photo-gallery-server` instance.
