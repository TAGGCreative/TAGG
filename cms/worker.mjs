import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import mediaCatalog from "../content/media-catalog.json"
import editorial from "../content/editorial-content.json"
import {
  allowedEmail,
  isProcessor,
  localDevelopment,
  matchesSecret,
} from "./auth.mjs"

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" }
const MAX_UPLOAD_BYTES = 80 * 1024 * 1024 * 1024
const PART_SIZE = 64 * 1024 * 1024
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"])
const VIDEO_ROLES = new Set(["main", "heroDesktop", "heroMobile"])
const DERIVATIVE_ROLE = "projectDerivatives"
const IMAGE_ROLES = new Set(["poster", "head", "mask"])
const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS content_documents (key TEXT PRIMARY KEY, content_json TEXT NOT NULL, revision_id TEXT, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS revisions (id TEXT PRIMARY KEY, content_json TEXT NOT NULL, label TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL, is_published INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS processing_jobs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, asset_role TEXT NOT NULL, object_key TEXT NOT NULL, original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, status TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, error TEXT, lease_until TEXT, options_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS access_users (email TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS revisions_created_at_idx ON revisions(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS processing_jobs_status_idx ON processing_jobs(status, created_at)`,
]

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...JSON_HEADERS, "cache-control": "no-store", ...extraHeaders },
  })
}

function now() {
  return new Date().toISOString()
}

function cmsKey(env, path) {
  const prefix = String(env.CMS_STORAGE_PREFIX || "cms").replace(
    /^\/+|\/+$/g,
    "",
  )
  return `${prefix}/${String(path).replace(/^\/+/, "")}`
}

function uploadBucket(env, key) {
  return key.startsWith(cmsKey(env, "originals/"))
    ? env.PRIVATE_MEDIA
    : env.MEDIA
}

function initialContent() {
  const content = {
    version: 1,
    updatedAt: mediaCatalog.generatedAt,
    media: structuredClone(mediaCatalog),
    editorial: structuredClone(editorial),
  }
  return normalizeCarousel(content)
}

function normalizeCarousel(content) {
  if (!content?.media) return content
  content.media.carousels ||= { desktop: [], mobile: [] }
  content.media.carousels.desktop ||= []
  content.media.carousels.mobile ||= []

  const projectIds = new Set(
    (content.media.works || []).map((project) => String(project.id)),
  )
  const existingOrder = [
    ...(content.media.carouselOrder || []),
    ...content.media.carousels.desktop.map((clip) => clip.projectId),
    ...content.media.carousels.mobile.map((clip) => clip.projectId),
  ]
  content.media.carouselOrder = [
    ...new Set(existingOrder.map(String).filter((id) => projectIds.has(id))),
  ]
  content.media.carouselSettings ||= {}

  for (const projectId of content.media.carouselOrder) {
    const settings = (content.media.carouselSettings[projectId] ||= {})
    if (typeof settings.approved !== "boolean")
      settings.approved = content.media.carousels.desktop.some(
        (clip) => clip.projectId === projectId && clip.source,
      )
    delete settings.framing
    delete settings.focusBias
  }

  const order = new Map(
    content.media.carouselOrder.map((projectId, index) => [projectId, index]),
  )
  for (const collection of ["desktop", "mobile"]) {
    content.media.carousels[collection] = content.media.carousels[collection]
      .filter((clip) => order.has(String(clip.projectId)))
      .sort(
        (a, b) =>
          order.get(String(a.projectId)) - order.get(String(b.projectId)),
      )
  }
  return content
}

function checkOrigin(request) {
  if (!MUTATING.has(request.method)) return true
  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}

async function ensureSchema(env) {
  await env.DB.batch(schemaStatements.map((sql) => env.DB.prepare(sql)))
}

async function ensureSeed(env, email) {
  const existing = await env.DB.prepare(
    "SELECT key FROM content_documents WHERE key = ?",
  )
    .bind("draft")
    .first()
  if (existing) return
  const timestamp = now()
  const content = JSON.stringify(initialContent())
  const revisionId = crypto.randomUUID()
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO revisions (id, content_json, label, created_at, created_by, is_published) SELECT ?, ?, ?, ?, ?, 1 WHERE NOT EXISTS (SELECT 1 FROM content_documents WHERE key = 'draft')",
    ).bind(revisionId, content, "Imported current site", timestamp, email),
    ...["draft", "published"].map((key) =>
      env.DB.prepare(
        "INSERT INTO content_documents (key, content_json, revision_id, updated_at, updated_by) SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM revisions WHERE id = ?)",
      ).bind(key, content, revisionId, timestamp, email, revisionId),
    ),
  ])
}

async function recordUser(env, email) {
  const timestamp = now()
  await env.DB.prepare(
    "INSERT INTO access_users (email, first_seen_at, last_seen_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET last_seen_at = excluded.last_seen_at",
  )
    .bind(email, timestamp, timestamp)
    .run()
}

async function readDocument(env, key) {
  const row = await env.DB.prepare(
    "SELECT * FROM content_documents WHERE key = ?",
  )
    .bind(key)
    .first()
  return row ? { ...row, content: JSON.parse(row.content_json) } : null
}

async function draftETag(contentJson, updatedAt) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify([updatedAt, contentJson])),
  )
  return `"${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}"`
}

function validateContent(content) {
  normalizeCarousel(content)
  const errors = []
  if (!content?.media || !Array.isArray(content.media.works))
    errors.push("Projects are missing.")
  if (!content?.media?.carousels?.desktop || !content?.media?.carousels?.mobile)
    errors.push("Carousel collections are missing.")
  if (
    !content?.editorial?.sections ||
    !content?.editorial?.people ||
    !content?.editorial?.contact
  )
    errors.push("Site copy is incomplete.")
  const ids = new Set()
  for (const project of content?.media?.works || []) {
    if (
      typeof project.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,120}$/.test(project.id) ||
      !project.client?.trim() ||
      !project.title?.trim()
    )
      errors.push("Every project needs an ID, client, and title.")
    if (ids.has(project.id)) errors.push(`Duplicate project ID: ${project.id}`)
    ids.add(project.id)
    if (
      project.visible !== false &&
      !project.source?.url &&
      project.source?.provider !== "cloudflare"
    ) {
      errors.push(
        `${project.client || "Project"} is missing a ready main video.`,
      )
    }
  }
  const desktopIds = new Set(
    (content?.media?.carousels?.desktop || []).map((clip) => clip.projectId),
  )
  if (!(content?.media?.carouselOrder || []).length)
    errors.push("The homepage carousel needs at least one project.")
  for (const projectId of content?.media?.carouselOrder || []) {
    const project = (content.media.works || []).find(
      (item) => item.id === projectId,
    )
    if (!desktopIds.has(projectId))
      errors.push(
        `${project?.client || "A carousel project"} needs a desktop carousel clip before publishing.`,
      )
    for (const format of ["desktop", "mobile"]) {
      const clip = (content.media.carousels[format] || []).find(
        (item) => item.projectId === projectId,
      )
      if (clip && !clip.source?.url && !clip.source?.id)
        errors.push(
          `${project?.client || "A carousel project"} has an incomplete ${format} clip.`,
        )
    }
    if (content.media.carouselSettings?.[projectId]?.approved !== true)
      errors.push(
        `${project?.client || "A carousel project"} still needs carousel approval.`,
      )
  }
  return [...new Set(errors)]
}

function s3Client(env) {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error("R2 S3 credentials are not configured.")
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

function safeName(value) {
  return (
    String(value || "upload")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "upload"
  )
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  )
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function revalidate(env, projectIds) {
  if (!env.PUBLIC_SITE_URL || !env.REVALIDATE_SECRET)
    throw new Error("Site refresh is not configured.")
  const body = JSON.stringify({ projectIds })
  const signature = await hmacHex(env.REVALIDATE_SECRET, body)
  const response = await fetch(
    `${env.PUBLIC_SITE_URL.replace(/\/$/, "")}/api/cms-revalidate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tagg-signature": signature,
      },
      body,
    },
  )
  if (!response.ok) throw new Error(`Site refresh failed (${response.status})`)
  return response.json()
}

async function bootstrap(env, email) {
  const [draft, published, revisions, jobs] = await Promise.all([
    readDocument(env, "draft"),
    readDocument(env, "published"),
    env.DB.prepare(
      "SELECT id, label, created_at, created_by, is_published FROM revisions ORDER BY created_at DESC LIMIT 25",
    ).all(),
    env.DB.prepare(
      "SELECT id, project_id, asset_role, original_name, status, progress, error, created_at, updated_at FROM processing_jobs ORDER BY created_at DESC LIMIT 100",
    ).all(),
  ])
  normalizeCarousel(draft.content)
  return json({
    user: { email },
    draft: draft.content,
    draftMeta: {
      etag: await draftETag(draft.content_json, draft.updated_at),
      revisionId: draft.revision_id,
      updatedAt: draft.updated_at,
      updatedBy: draft.updated_by,
    },
    publishedRevisionId: published?.revision_id || null,
    revisions: revisions.results,
    jobs: jobs.results,
  })
}

async function processingJobs(env) {
  const jobs = await env.DB.prepare(
    "SELECT id, project_id, asset_role, original_name, status, progress, error, created_at, updated_at FROM processing_jobs ORDER BY created_at DESC LIMIT 100",
  ).all()
  return json({ jobs: jobs.results })
}

async function saveDraft(request, env, email) {
  const expected = request.headers.get("If-Match")
  if (!expected) return json({ error: "Reload the editor before saving." }, 428)
  const draft = await readDocument(env, "draft")
  const conflict = () =>
    json(
      {
        error:
          "This draft changed in another tab or during media processing. Copy your unsaved edits before reloading.",
      },
      412,
    )
  if (expected !== (await draftETag(draft.content_json, draft.updated_at)))
    return conflict()
  const content = await request.json()
  normalizeCarousel(content)
  const errors = validateContent(content).filter(
    (error) =>
      !error.includes("missing a ready main video") &&
      !error.includes("needs both desktop and mobile clips") &&
      !error.includes("needs a desktop carousel clip") &&
      !error.includes("homepage carousel needs") &&
      !error.includes("has an incomplete") &&
      !error.includes("needs carousel approval"),
  )
  if (errors.length) return json({ error: "Draft is invalid.", errors }, 400)
  content.updatedAt = now()
  const serialized = JSON.stringify(content)
  const result = await env.DB.prepare(
    "UPDATE content_documents SET content_json = ?, updated_at = ?, updated_by = ? WHERE key = 'draft' AND content_json = ? AND updated_at = ?",
  )
    .bind(
      serialized,
      content.updatedAt,
      email,
      draft.content_json,
      draft.updated_at,
    )
    .run()
  if (result.meta.changes !== 1) return conflict()
  return json({
    savedAt: content.updatedAt,
    etag: await draftETag(serialized, content.updatedAt),
  })
}

async function createPreview(env) {
  if (!env.PREVIEW_SECRET || !env.PUBLIC_SITE_URL || !env.PRIVATE_MEDIA)
    return json({ error: "Preview storage is not configured." }, 503)
  const draft = await readDocument(env, "draft")
  const token = crypto.randomUUID()
  const expires = Math.floor(Date.now() / 1000) + 60 * 60
  await env.PRIVATE_MEDIA.put(
    cmsKey(env, `previews/${token}.json`),
    JSON.stringify(draft.content),
    {
      customMetadata: {
        expiresAt: String(expires),
      },
      httpMetadata: {
        contentType: "application/json",
        cacheControl: "private, no-store",
      },
    },
  )
  const signature = await hmacHex(env.PREVIEW_SECRET, `${token}.${expires}`)
  const site = env.PUBLIC_SITE_URL.replace(/\/$/, "")
  return json({
    url: `${site}/api/cms-preview?token=${encodeURIComponent(token)}&expires=${expires}&signature=${signature}`,
  })
}

async function readPreview(request, env, token) {
  if (
    !env.PREVIEW_SECRET ||
    !matchesSecret(
      request.headers.get("authorization"),
      `Bearer ${env.PREVIEW_SECRET}`,
    )
  )
    return json({ error: "Unauthorized" }, 401)
  const snapshot = await env.PRIVATE_MEDIA.get(
    cmsKey(env, `previews/${token}.json`),
  )
  if (!snapshot) return json({ error: "Preview not found." }, 404)
  const expires = Number(snapshot.customMetadata?.expiresAt)
  if (!Number.isSafeInteger(expires) || expires * 1000 <= Date.now()) {
    await snapshot.body.cancel()
    return json({ error: "Preview expired." }, 410)
  }
  return new Response(snapshot.body, {
    headers: { ...JSON_HEADERS, "cache-control": "private, no-store" },
  })
}

async function publish(request, env, email) {
  const [draft, previous] = await Promise.all([
    readDocument(env, "draft"),
    readDocument(env, "published"),
  ])
  const expected = request.headers.get("If-Match")
  if (!expected)
    return json({ error: "Reload the editor before publishing." }, 428)
  if (expected !== (await draftETag(draft.content_json, draft.updated_at)))
    return json(
      { error: "The draft changed. Reload it before publishing." },
      412,
    )
  const errors = validateContent(draft.content)
  const activeJobs = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM processing_jobs WHERE status IN ('uploading', 'waiting', 'processing')",
  ).first()
  if (Number(activeJobs?.count || 0) > 0)
    errors.push("Media is still uploading or processing.")
  if (errors.length)
    return json({ error: "This draft is not ready to publish.", errors }, 409)

  const timestamp = now()
  const revisionId = crypto.randomUUID()
  draft.content.updatedAt = timestamp
  const serialized = JSON.stringify(draft.content)
  const [created] = await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO revisions (id, content_json, label, created_at, created_by, is_published) SELECT ?, ?, ?, ?, ?, 1 WHERE EXISTS (SELECT 1 FROM content_documents WHERE key = 'draft' AND content_json = ? AND updated_at = ?) AND EXISTS (SELECT 1 FROM content_documents WHERE key = 'published' AND revision_id = ?) AND NOT EXISTS (SELECT 1 FROM processing_jobs WHERE status IN ('uploading', 'waiting', 'processing'))",
    ).bind(
      revisionId,
      serialized,
      `Published ${new Date(timestamp).toLocaleString("en-CA")}`,
      timestamp,
      email,
      draft.content_json,
      draft.updated_at,
      previous.revision_id,
    ),
    env.DB.prepare(
      "UPDATE revisions SET is_published = 0 WHERE id <> ? AND is_published = 1 AND EXISTS (SELECT 1 FROM revisions WHERE id = ?)",
    ).bind(revisionId, revisionId),
    env.DB.prepare(
      "UPDATE content_documents SET content_json = ?, revision_id = ?, updated_at = ?, updated_by = ? WHERE key IN ('published', 'draft') AND EXISTS (SELECT 1 FROM revisions WHERE id = ?)",
    ).bind(serialized, revisionId, timestamp, email, revisionId),
  ])
  if (!created.meta.changes)
    return json(
      {
        error:
          "The draft, media jobs or published version changed. Reload before publishing again.",
      },
      409,
    )

  const projectIds = [
    ...new Set(
      [...previous.content.media.works, ...draft.content.media.works].map(
        ({ id }) => id,
      ),
    ),
  ]
  const refresh = await refreshPublishedRoutes(env, projectIds)
  return json({ revisionId, publishedAt: timestamp, ...refresh })
}

async function refreshPublishedRoutes(env, projectIds) {
  try {
    const result = await revalidate(env, projectIds)
    return { propagation: "complete", revalidated: result.revalidated }
  } catch (error) {
    return { propagation: "pending", refreshError: error.message }
  }
}

async function retryPublishedRefresh(env) {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT json_extract(project.value, '$.id') AS id FROM revisions, json_each(revisions.content_json, '$.media.works') AS project",
  ).all()
  return json(
    await refreshPublishedRoutes(
      env,
      results.map(({ id }) => id).filter(Boolean),
    ),
  )
}

async function restoreRevision(request, env, email, id) {
  const expected = request.headers.get("If-Match")
  if (!expected)
    return json({ error: "Reload the editor before restoring." }, 428)
  const [draft, revision] = await Promise.all([
    readDocument(env, "draft"),
    env.DB.prepare("SELECT content_json FROM revisions WHERE id = ?")
      .bind(id)
      .first(),
  ])
  if (!revision) return json({ error: "Revision not found." }, 404)
  const conflict = () =>
    json({ error: "The draft changed. Reload it before restoring." }, 412)
  if (expected !== (await draftETag(draft.content_json, draft.updated_at)))
    return conflict()
  const result = await env.DB.prepare(
    "UPDATE content_documents SET content_json = ?, updated_at = ?, updated_by = ? WHERE key = 'draft' AND content_json = ? AND updated_at = ?",
  )
    .bind(
      revision.content_json,
      now(),
      email,
      draft.content_json,
      draft.updated_at,
    )
    .run()
  return result.meta.changes ? json({ restored: id }) : conflict()
}

async function projectMediaSource(env, projectId) {
  const job = await env.DB.prepare(
    "SELECT object_key, mime_type, original_name FROM processing_jobs WHERE project_id = ? AND asset_role = 'main' AND status = 'ready' ORDER BY updated_at DESC LIMIT 1",
  )
    .bind(projectId)
    .first()
  if (!job || String(job.object_key).startsWith("external:"))
    return json(
      { error: "Upload this project's master before choosing its frames." },
      409,
    )
  const url = await getSignedUrl(
    s3Client(env),
    new GetObjectCommand({
      Bucket: env.R2_PRIVATE_BUCKET_NAME,
      Key: job.object_key,
      ResponseContentType: job.mime_type,
    }),
    { expiresIn: 2 * 60 * 60 },
  )
  return json({ url, name: job.original_name })
}

async function queueProjectDerivatives(request, env, email, projectId) {
  const input = await request.json()
  const posterTime = Number(input.posterTime)
  const previewStart = Number(input.previewStart)
  if (
    !Number.isFinite(posterTime) ||
    !Number.isFinite(previewStart) ||
    posterTime < 0 ||
    previewStart < 0 ||
    posterTime > 24 * 60 * 60 ||
    previewStart > 24 * 60 * 60
  )
    return json({ error: "Choose valid poster and preview times." }, 400)

  const draft = await readDocument(env, "draft")
  const project = draft.content.media.works.find(
    (item) => String(item.id) === projectId,
  )
  if (!project) return json({ error: "Project not found." }, 404)

  const active = await env.DB.prepare(
    "SELECT id FROM processing_jobs WHERE project_id = ? AND asset_role = ? AND status IN ('waiting', 'processing') LIMIT 1",
  )
    .bind(projectId, DERIVATIVE_ROLE)
    .first()
  if (active)
    return json(
      { error: "That poster and hover preview are already processing." },
      409,
    )

  const master = await env.DB.prepare(
    "SELECT object_key, original_name, mime_type, size_bytes FROM processing_jobs WHERE project_id = ? AND asset_role = 'main' AND status = 'ready' ORDER BY updated_at DESC LIMIT 1",
  )
    .bind(projectId)
    .first()
  if (!master || String(master.object_key).startsWith("external:"))
    return json(
      { error: "Upload this project's master before choosing its frames." },
      409,
    )

  const jobId = crypto.randomUUID()
  const timestamp = now()
  await env.DB.prepare(
    "INSERT INTO processing_jobs (id, project_id, asset_role, object_key, original_name, mime_type, size_bytes, status, options_json, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?, ?, ?, ?)",
  )
    .bind(
      jobId,
      projectId,
      DERIVATIVE_ROLE,
      master.object_key,
      master.original_name,
      master.mime_type,
      master.size_bytes,
      JSON.stringify({ posterTime, previewStart }),
      timestamp,
      timestamp,
      email,
    )
    .run()
  return json({ jobId, status: "waiting" })
}

async function startUpload(request, env, email) {
  const input = await request.json()
  const role = String(input.role || "")
  const mimeType = String(input.type || "application/octet-stream")
  const size = Number(input.size || 0)
  if (![...VIDEO_ROLES, ...IMAGE_ROLES].includes(role))
    return json({ error: "Unsupported asset role." }, 400)
  if (VIDEO_ROLES.has(role) && !mimeType.startsWith("video/"))
    return json({ error: "Please choose a video file." }, 400)
  if (IMAGE_ROLES.has(role) && !mimeType.startsWith("image/"))
    return json({ error: "Please choose an image file." }, 400)
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_UPLOAD_BYTES)
    return json({ error: "File is empty or larger than 80 GB." }, 400)
  const jobId = crypto.randomUUID()
  const projectId = String(input.projectId || "").trim()
  if (!projectId)
    return json({ error: "Save the project before uploading media." }, 400)
  const key = cmsKey(
    env,
    `${VIDEO_ROLES.has(role) ? "originals" : "assets"}/${projectId}/${role}/${jobId}-${safeName(input.fileName)}`,
  )
  const created = await uploadBucket(env, key).createMultipartUpload(key, {
    httpMetadata: { contentType: mimeType },
    customMetadata: { projectId, role, jobId },
  })
  const timestamp = now()
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE processing_jobs SET status = 'error', error = 'Superseded by a new upload', updated_at = ? WHERE project_id = ? AND asset_role = ? AND status = 'uploading'",
    ).bind(timestamp, projectId, role),
    env.DB.prepare(
      "INSERT INTO processing_jobs (id, project_id, asset_role, object_key, original_name, mime_type, size_bytes, status, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'uploading', ?, ?, ?)",
    ).bind(
      jobId,
      projectId,
      role,
      key,
      safeName(input.fileName),
      mimeType,
      size,
      timestamp,
      timestamp,
      email,
    ),
  ])
  return json({ jobId, uploadId: created.uploadId, key, partSize: PART_SIZE })
}

async function signUploadPart(request) {
  const { uploadId, key, partNumber } = await request.json()
  const origin = new URL(request.url).origin
  const query = new URLSearchParams({
    uploadId: String(uploadId),
    key: String(key),
    partNumber: String(partNumber),
  })
  return json({
    url: `${origin}/api/uploads/part-data?${query}`,
  })
}

async function uploadPart(request, env) {
  const url = new URL(request.url)
  const uploadId = url.searchParams.get("uploadId")
  const key = url.searchParams.get("key")
  const partNumber = Number(url.searchParams.get("partNumber"))
  if (!uploadId || !key || !Number.isInteger(partNumber) || partNumber < 1)
    return json({ error: "Invalid upload part." }, 400)
  const job = await env.DB.prepare(
    "SELECT id FROM processing_jobs WHERE object_key = ? AND status = 'uploading'",
  )
    .bind(key)
    .first()
  if (!job) return json({ error: "Upload session not found." }, 404)
  const part = await uploadBucket(env, key)
    .resumeMultipartUpload(key, uploadId)
    .uploadPart(partNumber, request.body)
  return new Response(null, {
    status: 200,
    headers: { etag: part.etag, "cache-control": "no-store" },
  })
}

async function completeUpload(request, env) {
  const { uploadId, key, jobId, parts } = await request.json()
  const job = await env.DB.prepare(
    "SELECT id, project_id, asset_role, object_key, size_bytes, status FROM processing_jobs WHERE id = ? AND object_key = ?",
  )
    .bind(String(jobId || ""), String(key || ""))
    .first()
  if (!job) return json({ error: "Upload session not found." }, 404)
  if (job.status !== "uploading") {
    if (["waiting", "processing", "ready"].includes(job.status))
      return json({ jobId, status: job.status })
    return json({ error: "This upload session is closed." }, 409)
  }
  if (
    typeof uploadId !== "string" ||
    !uploadId ||
    !Array.isArray(parts) ||
    parts.length !== Math.ceil(job.size_bytes / PART_SIZE) ||
    parts.some((part, index) => part?.partNumber !== index + 1 || !part.etag)
  )
    return json({ error: "Upload parts are incomplete." }, 400)

  const bucket = uploadBucket(env, key)
  let object = await bucket.head(key)
  if (!object) {
    try {
      object = await bucket
        .resumeMultipartUpload(key, uploadId)
        .complete(parts.map(({ etag, partNumber }) => ({ etag, partNumber })))
    } catch (error) {
      object = await bucket.head(key)
      if (!object) throw error
    }
  }
  if (object.customMetadata?.jobId !== jobId || object.size !== job.size_bytes)
    return json(
      { error: "Stored file does not match this upload session." },
      409,
    )

  if (IMAGE_ROLES.has(job.asset_role)) return attachImageToDraft(env, job)
  await env.DB.prepare(
    "UPDATE processing_jobs SET status = 'waiting', progress = 0, updated_at = ? WHERE id = ? AND status = 'uploading'",
  )
    .bind(now(), jobId)
    .run()
  const current = await env.DB.prepare(
    "SELECT status FROM processing_jobs WHERE id = ?",
  )
    .bind(jobId)
    .first()
  if (!current || current.status === "error")
    return json({ error: "This upload session is closed." }, 409)
  return json({ jobId, status: current.status })
}

async function abortUpload(request, env) {
  const { uploadId, key, jobId } = await request.json()
  const job = await env.DB.prepare(
    "SELECT id FROM processing_jobs WHERE id = ? AND object_key = ? AND status = 'uploading'",
  )
    .bind(String(jobId || ""), String(key || ""))
    .first()
  if (!job) return json({ error: "Upload session not found." }, 404)
  await uploadBucket(env, key).resumeMultipartUpload(key, uploadId).abort()
  await env.DB.prepare(
    "UPDATE processing_jobs SET status = 'error', error = ?, updated_at = ? WHERE id = ? AND status = 'uploading'",
  )
    .bind("Upload cancelled", now(), jobId)
    .run()
  return json({ aborted: jobId })
}

async function attachImageToDraft(env, job, retries = 3) {
  const draft = await readDocument(env, "draft")
  const project = draft.content.media.works.find(
    ({ id }) => id === job.project_id,
  )
  const person = [
    ...draft.content.editorial.people.leadership,
    ...draft.content.editorial.people.extended,
  ].find(({ id }) => id === job.project_id)
  const target = job.asset_role === "poster" ? project : person
  const timestamp = now()
  if (!target) {
    const result = await env.DB.prepare(
      "UPDATE processing_jobs SET status = 'error', error = ?, updated_at = ? WHERE id = ? AND status = 'uploading' AND EXISTS (SELECT 1 FROM content_documents WHERE key = 'draft' AND content_json = ? AND updated_at = ?)",
    )
      .bind(
        "Image target was removed from the draft.",
        timestamp,
        job.id,
        draft.content_json,
        draft.updated_at,
      )
      .run()
    if (result.meta.changes)
      return json({ error: "Image target was removed from the draft." }, 409)
  } else {
    const url = `${env.R2_PUBLIC_BASE_URL}/${job.object_key}`
    if (job.asset_role === "poster")
      target.poster = { src: url, width: 1920, height: 1080 }
    else target[job.asset_role] = url
    const [, attached] = await env.DB.batch([
      env.DB.prepare(
        "UPDATE content_documents SET content_json = ?, updated_at = ? WHERE key = 'draft' AND content_json = ? AND updated_at = ? AND EXISTS (SELECT 1 FROM processing_jobs WHERE id = ? AND status = 'uploading')",
      ).bind(
        JSON.stringify(draft.content),
        timestamp,
        draft.content_json,
        draft.updated_at,
        job.id,
      ),
      env.DB.prepare(
        "UPDATE processing_jobs SET status = 'ready', progress = 100, updated_at = ? WHERE id = ? AND changes() = 1",
      ).bind(timestamp, job.id),
    ])
    if (attached.meta.changes) return json({ jobId: job.id, status: "ready" })
  }
  const current = await env.DB.prepare(
    "SELECT status FROM processing_jobs WHERE id = ?",
  )
    .bind(job.id)
    .first()
  if (current?.status === "ready")
    return json({ jobId: job.id, status: "ready" })
  if (current?.status !== "uploading")
    return json({ error: "This upload session is closed." }, 409)
  if (retries > 0) return attachImageToDraft(env, job, retries - 1)
  return json(
    {
      error:
        "The draft is busy. Choose the same file to retry attaching the image.",
    },
    409,
  )
}

async function nextProcessorJob(request, env) {
  const timestamp = now()
  const expired = timestamp
  const job = await env.DB.prepare(
    "SELECT * FROM processing_jobs WHERE status = 'waiting' OR (status = 'processing' AND lease_until < ?) ORDER BY CASE asset_role WHEN 'main' THEN 0 WHEN 'projectDerivatives' THEN 1 WHEN 'heroDesktop' THEN 2 WHEN 'heroMobile' THEN 2 ELSE 3 END, created_at LIMIT 1",
  )
    .bind(expired)
    .first()
  if (!job) return json({ job: null })
  const leaseUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const updated = await env.DB.prepare(
    "UPDATE processing_jobs SET status = 'processing', attempts = attempts + 1, lease_until = ?, updated_at = ?, error = NULL WHERE id = ? AND (status = 'waiting' OR lease_until < ?)",
  )
    .bind(leaseUntil, timestamp, job.id, expired)
    .run()
  if (!updated.meta.changes) return json({ job: null })
  const requestUrl = new URL(request.url)
  const local = localDevelopment(request, env)
  const downloadUrl = String(job.object_key).startsWith("external:")
    ? atob(String(job.object_key).slice("external:".length))
    : local
      ? `${requestUrl.origin}/api/processor/jobs/${job.id}/original`
      : await getSignedUrl(
          s3Client(env),
          new GetObjectCommand({
            Bucket: env.R2_PRIVATE_BUCKET_NAME,
            Key: job.object_key,
          }),
          { expiresIn: 60 * 60 },
        )
  return json({
    job: {
      ...job,
      attempts: job.attempts + 1,
      status: "processing",
      lease_until: leaseUntil,
      downloadUrl,
      options: JSON.parse(job.options_json || "{}"),
      outputPrefix: outputPrefix(job, job.attempts + 1),
    },
  })
}

function outputPrefix(job, attempt) {
  return `videos/${job.project_id}/${job.asset_role}/${job.id}/attempt-${attempt}`
}

function lostLease() {
  return json(
    { error: "This processing attempt no longer holds the job." },
    409,
  )
}

async function processorOriginal(env, id) {
  const job = await env.DB.prepare(
    "SELECT object_key, mime_type FROM processing_jobs WHERE id = ?",
  )
    .bind(id)
    .first()
  if (!job || String(job.object_key).startsWith("external:"))
    return json({ error: "Original not found." }, 404)
  const object = await env.PRIVATE_MEDIA.get(job.object_key)
  if (!object) return json({ error: "Original not found." }, 404)
  return new Response(object.body, {
    headers: {
      "content-type": job.mime_type || "application/octet-stream",
      "content-length": String(object.size),
      "cache-control": "no-store",
    },
  })
}

async function processorUploadUrl(request, env, job) {
  const { key, contentType, contentLength, cacheControl } = await request.json()
  if (!String(key).startsWith(`${outputPrefix(job, job.attempts)}/`))
    return json({ error: "Invalid output key." }, 400)
  if (localDevelopment(request, env)) {
    const url = new URL(`/api/processor/jobs/${job.id}/output`, request.url)
    url.searchParams.set("key", key)
    return json({ url: url.href })
  }
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: Number(contentLength),
    CacheControl: cacheControl,
  })
  return json({
    url: await getSignedUrl(s3Client(env), command, { expiresIn: 15 * 60 }),
  })
}

async function writeLocalProcessorOutput(request, env, job) {
  const key = new URL(request.url).searchParams.get("key")
  if (!key?.startsWith(`${outputPrefix(job, job.attempts)}/`))
    return json({ error: "Invalid output key." }, 400)
  await env.MEDIA.put(key, request.body, {
    httpMetadata: {
      contentType:
        request.headers.get("content-type") || "application/octet-stream",
    },
  })
  return new Response(null, { status: 204 })
}

async function readLocalPublicMedia(request, env, key) {
  const object = await env.MEDIA.get(key, { range: request.headers })
  if (!object) return json({ error: "Media not found." }, 404)
  const headers = new Headers({
    "access-control-allow-origin": "*",
    "accept-ranges": "bytes",
    "cache-control": "no-store",
  })
  object.writeHttpMetadata(headers)
  if (request.headers.has("range") && object.range) {
    const length = object.range.length ?? object.range.suffix
    const start = object.range.offset ?? object.size - length
    headers.set(
      "content-range",
      `bytes ${start}-${start + length - 1}/${object.size}`,
    )
    headers.set("content-length", String(length))
    return new Response(object.body, { status: 206, headers })
  }
  headers.set("content-length", String(object.size))
  return new Response(object.body, { headers })
}

async function readPlaylist(bucket, key) {
  const object = await bucket.get(key)
  if (!object) return null
  if (object.size > 8 * 1024 * 1024) {
    await object.body.cancel()
    return null
  }
  const lines = (await object.text())
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines[0] === "#EXTM3U" ? lines : null
}

async function hasReadyRendition(bucket, prefix) {
  const lines = await readPlaylist(bucket, `${prefix}index.m3u8`)
  if (
    !lines?.includes("#EXT-X-ENDLIST") ||
    !lines.includes('#EXT-X-MAP:URI="init.mp4"')
  )
    return false
  const segments = lines.filter((line) => !line.startsWith("#"))
  if (
    !segments.length ||
    segments.some((name) => !/^segment_\d+\.m4s$/.test(name))
  )
    return false
  const missing = new Set(
    ["init.mp4", ...segments].map((name) => prefix + name),
  )
  let cursor
  do {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) {
      if (object.size > 0) missing.delete(object.key)
    }
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor && missing.size)
  return missing.size === 0
}

async function hasReadyStream(bucket, prefix) {
  const lines = await readPlaylist(bucket, `${prefix}/master.m3u8`)
  const variants = lines?.filter((line) => !line.startsWith("#"))
  if (
    !variants?.length ||
    variants.length > 4 ||
    variants.some((line) => !/^(1080|720|540|360)p\/index\.m3u8$/.test(line))
  )
    return false
  const ready = await Promise.all(
    variants.map((line) =>
      hasReadyRendition(
        bucket,
        `${prefix}/${line.slice(0, line.indexOf("/") + 1)}`,
      ),
    ),
  )
  return ready.every(Boolean)
}

async function updateProcessorJob(request, env, job, action) {
  const id = job.id
  const input = await request.json().catch(() => ({}))
  const timestamp = now()
  if (action === "progress") {
    const progress = Math.max(0, Math.min(99, Number(input.progress || 0)))
    const result = await env.DB.prepare(
      "UPDATE processing_jobs SET progress = MAX(progress, ?), lease_until = ?, updated_at = ? WHERE id = ? AND status = 'processing' AND attempts = ? AND lease_until > ?",
    )
      .bind(
        progress,
        new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        timestamp,
        id,
        job.attempts,
        timestamp,
      )
      .run()
    return result.meta.changes ? json({ progress }) : lostLease()
  }
  if (action === "error") {
    const result = await env.DB.prepare(
      "UPDATE processing_jobs SET status = 'error', error = ?, lease_until = NULL, updated_at = ? WHERE id = ? AND status = 'processing' AND attempts = ? AND lease_until > ?",
    )
      .bind(
        String(input.error || "Processing failed").slice(0, 1000),
        timestamp,
        id,
        job.attempts,
        timestamp,
      )
      .run()
    return result.meta.changes ? json({ status: "error" }) : lostLease()
  }

  const output = input.output || {}
  const requiredFiles =
    job.asset_role === "main"
      ? { masterKey: "master.m3u8", scrubKey: "scrub.mp4" }
      : job.asset_role === DERIVATIVE_ROLE
        ? { posterKey: "poster.jpg", previewMp4Key: "preview.mp4" }
        : { masterKey: "master.m3u8", posterKey: "poster.jpg" }
  const prefix = outputPrefix(job, job.attempts)
  const ready = await Promise.all(
    Object.entries(requiredFiles).map(
      async ([field, name]) =>
        output[field] === `${prefix}/${name}` &&
        (await env.MEDIA.head(output[field]))?.size > 0,
    ),
  )
  if (
    ready.some((file) => !file) ||
    (requiredFiles.masterKey && !(await hasReadyStream(env.MEDIA, prefix)))
  )
    return json({ error: "The processing output is incomplete." }, 409)
  return completeProcessorJob(env, job, output)
}

async function completeProcessorJob(env, job, output, retries = 3) {
  const timestamp = now()
  const draft = await readDocument(env, "draft")
  normalizeCarousel(draft.content)
  const baseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")
  const project = draft.content.media.works.find(
    (item) => item.id === job.project_id,
  )
  if (!project) return json({ error: "Project no longer exists." }, 409)
  if (job.asset_role === "main") {
    project.source = { provider: "hls", url: `${baseUrl}/${output.masterKey}` }
    project.cmsScrubUrl = output.scrubKey
      ? `${baseUrl}/${output.scrubKey}`
      : null
    delete project.carouselDraft
  } else if (job.asset_role === DERIVATIVE_ROLE) {
    project.poster = {
      src: `${baseUrl}/${output.posterKey}`,
      width: output.width || 1920,
      height: output.height || 1080,
    }
    project.preview = {
      provider: "static",
      mp4: `${baseUrl}/${output.previewMp4Key}`,
    }
    project.mediaSelection = {
      posterTime: Number(output.posterTime || 0),
      previewStart: Number(output.previewStart || 0),
      updatedAt: timestamp,
    }
  } else if (["heroDesktop", "heroMobile"].includes(job.asset_role)) {
    const collection = job.asset_role.includes("Mobile") ? "mobile" : "desktop"
    if (!draft.content.media.carouselOrder.includes(job.project_id))
      draft.content.media.carouselOrder.push(job.project_id)
    const clips = draft.content.media.carousels[collection]
    const entry = clips.find((item) => item.projectId === job.project_id)
    const clip = {
      id: `${job.project_id}-${collection}`,
      projectId: job.project_id,
      client: project.client,
      title: project.title,
      source: { provider: "hls", url: `${baseUrl}/${output.masterKey}` },
      poster: output.posterKey
        ? {
            src: `${baseUrl}/${output.posterKey}`,
            width: output.width || (collection === "mobile" ? 1080 : 1920),
            height: output.height || (collection === "mobile" ? 1920 : 1080),
          }
        : project.poster,
    }
    if (entry) Object.assign(entry, clip)
    else clips.push(clip)
    normalizeCarousel(draft.content)
  }
  const [draftUpdate] = await env.DB.batch([
    env.DB.prepare(
      "UPDATE content_documents SET content_json = ?, updated_at = ? WHERE key = 'draft' AND content_json = ? AND updated_at = ? AND EXISTS (SELECT 1 FROM processing_jobs WHERE id = ? AND status = 'processing' AND attempts = ? AND lease_until > ?)",
    ).bind(
      JSON.stringify(draft.content),
      timestamp,
      draft.content_json,
      draft.updated_at,
      job.id,
      job.attempts,
      timestamp,
    ),
    env.DB.prepare(
      "UPDATE processing_jobs SET status = 'ready', progress = 100, lease_until = NULL, updated_at = ? WHERE id = ? AND changes() = 1",
    ).bind(timestamp, job.id),
  ])
  if (!draftUpdate.meta.changes) {
    const current = await env.DB.prepare(
      "SELECT status, attempts, lease_until FROM processing_jobs WHERE id = ?",
    )
      .bind(job.id)
      .first()
    if (current?.attempts !== job.attempts) return lostLease()
    if (current.status === "ready") return json({ status: "ready" })
    if (current.status !== "processing" || current.lease_until <= now())
      return lostLease()
    if (retries > 0) return completeProcessorJob(env, job, output, retries - 1)
    return json({ error: "The draft is busy. Retry job completion." }, 409)
  }
  return json({ status: "ready" })
}

async function routeApi(request, env, email) {
  const url = new URL(request.url)
  const path = url.pathname
  if (path === "/api/bootstrap" && request.method === "GET")
    return bootstrap(env, email)
  if (path === "/api/jobs" && request.method === "GET")
    return processingJobs(env)
  if (path === "/api/draft" && request.method === "PUT")
    return saveDraft(request, env, email)
  if (path === "/api/preview" && request.method === "POST")
    return createPreview(env)
  if (path === "/api/publish" && request.method === "POST")
    return publish(request, env, email)
  if (path === "/api/publish/refresh" && request.method === "POST")
    return retryPublishedRefresh(env)
  if (
    path.startsWith("/api/revisions/") &&
    path.endsWith("/restore") &&
    request.method === "POST"
  ) {
    return restoreRevision(request, env, email, path.split("/")[3])
  }
  if (path === "/api/uploads/start" && request.method === "POST")
    return startUpload(request, env, email)
  if (path === "/api/uploads/part" && request.method === "POST")
    return signUploadPart(request)
  if (path === "/api/uploads/part-data" && request.method === "PUT")
    return uploadPart(request, env)
  if (path === "/api/uploads/complete" && request.method === "POST")
    return completeUpload(request, env)
  if (path === "/api/uploads/abort" && request.method === "POST")
    return abortUpload(request, env)
  const mediaSourceMatch = path.match(
    /^\/api\/projects\/([^/]+)\/media-source$/,
  )
  if (mediaSourceMatch && request.method === "GET")
    return projectMediaSource(env, decodeURIComponent(mediaSourceMatch[1]))
  const mediaSelectionMatch = path.match(
    /^\/api\/projects\/([^/]+)\/media-selection$/,
  )
  if (mediaSelectionMatch && request.method === "POST")
    return queueProjectDerivatives(
      request,
      env,
      email,
      decodeURIComponent(mediaSelectionMatch[1]),
    )
  const retryMatch = path.match(/^\/api\/jobs\/([^/]+)\/retry$/)
  if (retryMatch && request.method === "POST") {
    const job = await env.DB.prepare(
      "SELECT object_key FROM processing_jobs WHERE id = ? AND status = 'error'",
    )
      .bind(retryMatch[1])
      .first()
    if (!job) return json({ error: "Processing job not found." }, 404)
    if (
      !String(job.object_key).startsWith("external:") &&
      !(await uploadBucket(env, job.object_key).head(job.object_key))
    )
      return json(
        { error: "The original upload is missing. Choose the file again." },
        409,
      )
    await env.DB.prepare(
      "UPDATE processing_jobs SET status = 'waiting', error = NULL, progress = 0, lease_until = NULL, updated_at = ? WHERE id = ? AND status = 'error'",
    )
      .bind(now(), retryMatch[1])
      .run()
    return json({ status: "waiting" })
  }
  return json({ error: "Not found" }, 404)
}

async function routeProcessor(request, env) {
  const path = new URL(request.url).pathname
  if (path === "/api/processor/jobs/next" && request.method === "GET")
    return nextProcessorJob(request, env)
  const originalMatch = path.match(
    /^\/api\/processor\/jobs\/([^/]+)\/original$/,
  )
  if (originalMatch && request.method === "GET")
    return processorOriginal(env, originalMatch[1])
  const match = path.match(
    /^\/api\/processor\/jobs\/([^/]+)\/(upload-url|progress|complete|error|output)$/,
  )
  if (
    !match ||
    (match[2] === "output"
      ? request.method !== "PUT" || !localDevelopment(request, env)
      : request.method !== "POST")
  )
    return json({ error: "Not found" }, 404)
  const job = await env.DB.prepare("SELECT * FROM processing_jobs WHERE id = ?")
    .bind(match[1])
    .first()
  if (!job) return json({ error: "Job not found." }, 404)
  if (request.headers.get("x-tagg-job-attempt") !== String(job.attempts))
    return lostLease()
  if (match[2] === "complete" && job.status === "ready")
    return json({ status: "ready" })
  if (
    job.status !== "processing" ||
    !job.lease_until ||
    job.lease_until <= now()
  )
    return lostLease()
  if (match[2] === "upload-url") return processorUploadUrl(request, env, job)
  if (match[2] === "output") return writeLocalProcessorOutput(request, env, job)
  return updateProcessorJob(request, env, job, match[2])
}

const worker = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      if (request.method === "GET" && localDevelopment(request, env)) {
        const key = url.pathname.slice(1)
        if (
          ["videos/", cmsKey(env, "assets/"), cmsKey(env, "published/")].some(
            (prefix) => key.startsWith(prefix),
          )
        )
          return readLocalPublicMedia(request, env, key)
      }
      if (
        url.pathname === "/api/published-content" &&
        request.method === "GET"
      ) {
        await ensureSchema(env)
        const published = await readDocument(env, "published")
        return published
          ? json(published.content, 200, {
              "x-tagg-revision": published.revision_id,
            })
          : json({ error: "Published content has not been initialized." }, 404)
      }
      const preview = url.pathname.match(
        /^\/api\/private-preview\/([a-f0-9-]{36})$/,
      )
      if (preview && request.method === "GET")
        return readPreview(request, env, preview[1])
      if (url.pathname.startsWith("/api/processor/")) {
        if (!isProcessor(request, env))
          return json({ error: "Unauthorized" }, 401)
        await ensureSchema(env)
        return routeProcessor(request, env)
      }
      if (url.pathname.startsWith("/api/")) {
        const email = await allowedEmail(request, env)
        if (!email) return json({ error: "Access denied" }, 403)
        if (!checkOrigin(request))
          return json({ error: "Invalid request origin" }, 403)
        await ensureSchema(env)
        await ensureSeed(env, email)
        await recordUser(env, email)
        return routeApi(request, env, email)
      }
      return env.ASSETS.fetch(request)
    } catch (error) {
      console.error(error)
      return json({ error: error.message || "Unexpected CMS error" }, 500)
    }
  },
}

export default worker
