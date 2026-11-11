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
2. Keep `tagg-media` for published assets. Create `tagg-cms-private` for
   video originals and preview snapshots. Keep both public access options
   disabled on the private bucket. Give the CMS R2 credential access to both
   buckets and apply the required browser CORS policy. Use R2 lifecycle rules
   to expire `cms/previews/` after one day. Before deploying over an existing
   CMS, copy its video originals to the private bucket under the same keys,
   verify the copies, then remove the public originals and old preview snapshots.
   Retain any existing public image assets referenced by published content.
3. Add Worker secrets with `wrangler secret put --config cms/wrangler.jsonc`:
   `PREVIEW_SECRET`, `REVALIDATE_SECRET`, `PROCESSOR_TOKEN`, `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.
4. Set `ALLOWED_EDITOR_EMAILS` to a comma-separated list of TAGG Google account
   addresses. Apply the D1 migration with `npm run cms:db:remote`, then deploy
   with `npm run cms:deploy`.
5. Put Cloudflare Access in front of `cms.taggcreative.com`, using Google as the
   identity provider and the same email allowlist. Set `CF_ACCESS_ISSUER` to
   the team URL (`https://TEAM.cloudflareaccess.com`, with no trailing slash)
   and `CF_ACCESS_AUDIENCE` to the editor application's AUD. The Worker checks
   the signed identity and email allowlist. For `/api/private-preview/*`,
   and `/api/published-content`, configure path-specific Access applications
   with a Service Auth policy limited to the Vercel CMS-fetch service token.
   The private preview endpoint also requires the Worker preview secret.
   Give the processor its own Access policy if its API is behind Access.

For local CMS work, run `npm run cms:db:local`, then `npm run cms:dev`. The local
command loads the existing media-storage connection from `.env` and uses the
development editor mode automatically. Run `npm run cms:processor:local` in
parallel whenever local carousel generations are queued; its localhost-only
credential is not accepted by the deployed CMS.

### Public-site connection

Set the public Next.js deployment values shown in `.env.example`:

- `CMS_PUBLISHED_CONTENT_URL=https://cms.taggcreative.com/api/published-content`
- `CMS_PREVIEW_SOURCE_URL=https://cms.taggcreative.com`
- `CMS_ACCESS_CLIENT_ID` and `CMS_ACCESS_CLIENT_SECRET` for the
  path-specific Access service token
- `CMS_PREVIEW_SECRET` to the same value as the Worker `PREVIEW_SECRET`
- `CMS_REVALIDATE_SECRET` to the same value as the Worker `REVALIDATE_SECRET`

The Worker serves the committed D1 published revision directly. Set
`CMS_PUBLISHED_CONTENT_URL` when switching an existing setup off the old R2
feed. Publishing refreshes the homepage and project routes from both revisions,
including removed projects. If the refresh request fails, use **History →
Refresh published pages** to retry. The site uses the checked-in catalog
before the feed is configured. If the configured feed fails, regeneration
fails and Next.js can retain the last good page.

### Mac media helper

The designated processing Mac needs Node.js, FFmpeg, and FFprobe. Put
`CMS_API_URL=https://cms.taggcreative.com` and the matching
`CMS_PROCESSOR_TOKEN` in the repository `.env`. If Cloudflare Access protects
the processor API, set `CMS_PROCESSOR_ACCESS_CLIENT_ID` and
`CMS_PROCESSOR_ACCESS_CLIENT_SECRET` from its service token. Test one queued
item with:

```bash
npm run cms:processor -- --once
```

When that succeeds, `scripts/install-cms-helper.sh` installs the same processor
as a background LaunchAgent. An expired processing job can be reclaimed by
another attempt. The new attempt writes to its own directory and output prefix.
The helper removes its temporary directory after a successful job and reports
failures to the Content Room. In the project editor, use **Choose frames** to
set the poster and hover start. Upload the desktop hero and any custom vertical
hero as separate clips, then approve the project in **Carousel**.

### Disposable staging rehearsal

1. Authenticate the Cloudflare CLI. Copy `cms/wrangler.preview.jsonc` to
   `cms/wrangler.preview.local.jsonc`. Create a disposable D1 database and
   separate staging public and private R2 buckets. Fill in the staging resource
   names, D1 ID, and staging-only CMS and site domains. The template has no
   routes. Add the staging CMS custom domain to the local config.
2. Set the staging Worker secrets through Wrangler. Configure Access for the
   staging editor, CMS fetch service, and processor. Keep the private bucket
   without a public URL, and set the public bucket URL and browser CORS policy
   for staging. Rotate any legacy staging secrets that were in source control.
3. Run the D1 migration and Worker deploy using the staging config explicitly.
   Seed it by opening the editor with the staging Access login. Configure an
   isolated Vercel preview with the staging feed, preview origin, and matching
   secrets. Point a one-shot processor at staging with its staging credentials.
4. Use synthetic media to run upload, recovery, preview, publish and rollback.
   Check both the staging homepage and the changed work route after each
   publication, and check that an expired preview and anonymous original are
   denied. Record the revision IDs and route results in the release notes.
