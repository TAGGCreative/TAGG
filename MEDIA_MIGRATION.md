# Vimeo to Cloudflare Stream migration

The website now reads `content/media-catalog.json` and does not contact Vimeo
during builds or page requests. Until the one-time migration is run, catalog
entries use Vimeo only as a playback fallback.

## Recommended destination

- Cloudflare Stream for full project videos and carousel clips. Stream handles
  encoding, adaptive playback, embeds, thumbnails, and delivery.
- Static site assets for the small hover previews and poster images. These are
  already stored under `public/media` and no longer load from Vimeo.

Cloudflare can import a video directly from a URL. Vimeo download URLs expire,
so the migration script requests each URL immediately before asking Cloudflare
to copy it.

## One-time setup

1. Enable Stream in the Cloudflare account.
2. Create an API token with `Stream Write` permission.
3. Copy `.env.example` values into the local `.env` file:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_STREAM_CUSTOMER_CODE`
4. Ensure the Vimeo token includes `public`, `private`, and `video_files`
   scopes so Vimeo returns temporary download URLs.

The token currently in this project can read showcase metadata, but Vimeo did
not return source/download links during verification. Replace it with a token
that has the scopes above before running the real migration.

## Migration commands

```bash
npm run media:migrate:dry
npm run media:migrate -- --limit=1
npm run media:migrate
npm run build
```

The script saves progress after each successful upload. It is safe to rerun:
entries already switched to Cloudflare are skipped.

## Adding work after Vimeo is retired

Upload new full videos and carousel clips in the Cloudflare Stream dashboard,
then add their Cloudflare UIDs and project copy to `content/media-catalog.json`.
Run `npm run build` before deployment.

Cloudflare references:

- https://developers.cloudflare.com/stream/uploading-videos/upload-via-link/
- https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/
- https://developers.cloudflare.com/stream/viewing-videos/displaying-thumbnails/
