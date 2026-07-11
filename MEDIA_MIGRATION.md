# Vimeo to Cloudflare R2 HLS migration

The site reads `content/media-catalog.json`; builds do not call Vimeo. The
migration downloads each original, creates adaptive HLS renditions, uploads
them to R2, and switches each catalog entry after its upload succeeds.

## Cloudflare setup

1. In R2, attach a custom domain to the `tagg-media` bucket. Recommended:
   `media.taggcreative.com`.
2. Configure bucket CORS to allow `https://taggcreative.com`,
   `https://www.taggcreative.com`, and the local preview origin.
3. Set the R2 variables from `.env.example`, including the resulting
   `R2_PUBLIC_BASE_URL`.

The token only needs Object Read & Write access to this bucket. Never commit
`.env`.

## Vimeo prerequisite

The Vimeo token needs `public`, `private`, and `video_files` scopes. On Vimeo
Standard or higher, the script uses the original file exposed by the API. On
older Plus accounts, it falls back to the best rendition legitimately served
by the existing TAGG website player (up to 1080p). That top rendition is
repackaged without quality loss; only the smaller adaptive renditions are
transcoded.

## Run it

```bash
npm run media:migrate:check
npm run media:migrate -- --limit=1
npm run media:migrate
npm run build
```

The generated set includes 1080p, 720p, and 540p where the source resolution
supports them, with six-second fragmented-MP4 HLS segments. Progress is saved
under ignored `.media-work/`; completed uploads are skipped on reruns. Add
`--keep-source` to retain local source and encoded files for inspection.

After migration, the custom player uses native HLS in Safari and `hls.js` in
other modern browsers.
