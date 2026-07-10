# TAGG Creative website

TAGG's portfolio site is a statically generated Next.js website. Project copy,
credits, poster images, carousel clips, and video-provider IDs live in
`content/media-catalog.json`.

Normal website builds do not contact Vimeo or Cloudflare APIs. This keeps the
site fast, repeatable, and available even if a media provider has an outage.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run format:check
npm run build
```

## Media architecture

- Full videos use the provider in each catalog entry's `source` object.
- Vimeo remains available only as a temporary playback fallback.
- Cloudflare Stream is the intended permanent provider.
- Poster images and lightweight hover previews are local static assets under
  `public/media`, so they no longer depend on Vimeo.

See `MEDIA_MIGRATION.md` for the one-time Cloudflare migration.

## Refreshing the catalog from Vimeo

During the transition, changes made in the three Vimeo showcases can be frozen
into the local catalog with:

```bash
npm run media:sync
```

This command also downloads poster images locally. It preserves any catalog
entries that have already been migrated to Cloudflare.

The local `.env` file needs:

- `ACCESS_TOKEN`
- `TAGG_ID`

See `.env.example` for the optional showcase and Cloudflare values.

## Adding a project after Vimeo is retired

1. Upload the full project and its carousel clip(s) to Cloudflare Stream.
2. Add the Stream UIDs, project copy, credits, and local poster paths to
   `content/media-catalog.json`.
3. Add optional MP4/WebM hover previews under `public/media/previews`.
4. Run the quality checks and deploy.

## Deployment

The repository is currently structured for Next.js hosting. `main` is the
production branch described by the previous Vercel workflow. The site can be
moved to another Next.js-compatible host independently of the media migration;
Cloudflare Stream does not require the website itself to be hosted by
Cloudflare.
