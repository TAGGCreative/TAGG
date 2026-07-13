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

## TAGG Content Room

The private CMS lives in `cms/` and is designed for
`https://cms.taggcreative.com`. It keeps the public site's layout and motion in
code while allowing trusted editors to manage projects, ordering, copy, people,
contact information, previews, and published revisions.

### Cloudflare resources

1. Create a D1 database named `tagg-cms`, then replace the placeholder
   `database_id` in `cms/wrangler.jsonc` with its ID.
2. Keep the existing `tagg-media` R2 binding and apply `cms/r2-cors.json` to the
   bucket. The `etag` response header is required for resumable multipart
   uploads.
3. Add Worker secrets with `wrangler secret put --config cms/wrangler.jsonc`:
   `PREVIEW_SECRET`, `REVALIDATE_SECRET`, `PROCESSOR_TOKEN`, `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.
4. Set `ALLOWED_EDITOR_EMAILS` to a comma-separated list of TAGG Google account
   addresses. Apply the D1 migration with `npm run cms:db:remote`, then deploy
   with `npm run cms:deploy`.
5. Put Cloudflare Access in front of `cms.taggcreative.com`, using Google as the
   identity provider and the same email allowlist. The Worker repeats the
   allowlist check server-side using Access's authenticated-email header.

For local CMS work, run `npm run cms:db:local`, then `npm run cms:dev`. The local
command loads the existing media-storage connection from `.env` and uses the
development editor mode automatically. Run `npm run cms:processor:local` in
parallel whenever local carousel generations are queued; its localhost-only
credential is not accepted by the deployed CMS.

### Public-site connection

Set the public Next.js deployment values shown in `.env.example`:

- `CMS_CONTENT_BASE_URL=https://media.taggcreative.com/cms`
- `CMS_PREVIEW_SECRET` to the same value as the Worker `PREVIEW_SECRET`
- `CMS_REVALIDATE_SECRET` to the same value as the Worker `REVALIDATE_SECRET`

The site uses the checked-in catalog and editorial content whenever the remote
snapshot is unavailable. Published snapshots revalidate the homepage and work
routes immediately, with one-minute ISR as the fallback.

### Mac media helper

The designated processing Mac needs Node.js, FFmpeg, and FFprobe. Put
`CMS_API_URL=https://cms.taggcreative.com` and the matching
`CMS_PROCESSOR_TOKEN` in the repository `.env`, then test one queued item with:

```bash
npm run cms:processor -- --once
```

When that succeeds, `scripts/install-cms-helper.sh` installs the same processor
as a background LaunchAgent. It resumes leased work, keeps partial local work
through interruptions, clears completed temporary files, and reports errors to
the Content Room. Each master upload also creates a desktop carousel rough cut
and a set of downloadable scene clips. Editors can bring those clips into
Resolve for intentional 9:16 reframing, then upload the finished mobile carousel
video before approving the project for publishing. Projects that already have a
master can create the same package from the Carousel screen with **Generate from
existing master**; the generated cut remains a draft until **Use generated cut**
is selected.
