import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import mediaCatalog from "../content/media-catalog.json"
import editorial from "../content/editorial-content.json"

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
      settings.approved = ["desktop", "mobile"].every((format) =>
        content.media.carousels[format].some(
          (clip) => clip.projectId === projectId && clip.source,
        ),
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

function allowedEmail(request, env) {
  const url = new URL(request.url)
  if (
    env.ENVIRONMENT === "development" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    return "local-editor@taggcreative.com"
  }
  if (
    env.ENVIRONMENT === "preview" &&
    env.PREVIEW_EDITOR_TOKEN &&
    request.headers.get("x-tagg-preview-token") === env.PREVIEW_EDITOR_TOKEN
  )
    return "preview-editor@taggcreative.com"
  const email = request.headers
    .get("cf-access-authenticated-user-email")
    ?.trim()
    .toLowerCase()
  if (!email) return null
  const allowlist = String(env.ALLOWED_EDITOR_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email) ? email : null
}

function isProcessor(request, env) {
  const authorization = request.headers.get("authorization") || ""
  const hostname = new URL(request.url).hostname
  if (
    ["localhost", "127.0.0.1"].includes(hostname) &&
    authorization === "Bearer local-tagg-processor"
  )
    return true
  return Boolean(
    env.PROCESSOR_TOKEN && authorization === `Bearer ${env.PROCESSOR_TOKEN}`,
  )
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
      "INSERT INTO content_documents (key, content_json, revision_id, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)",
    ).bind("draft", content, revisionId, timestamp, email),
    env.DB.prepare(
      "INSERT INTO content_documents (key, content_json, revision_id, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)",
    ).bind("published", content, revisionId, timestamp, email),
    env.DB.prepare(
      "INSERT INTO revisions (id, content_json, label, created_at, created_by, is_published) VALUES (?, ?, ?, ?, ?, 1)",
    ).bind(revisionId, content, "Imported current site", timestamp, email),
  ])
  await env.MEDIA.put(cmsKey(env, "published/current.json"), content, {
    httpMetadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=60",
    },
  })
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
    if (!project.id || !project.client?.trim() || !project.title?.trim())
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
  const mobileIds = new Set(
    (content?.media?.carousels?.mobile || []).map((clip) => clip.projectId),
  )
  if (!(content?.media?.carouselOrder || []).length)
    errors.push("The homepage carousel needs at least one project.")
  for (const projectId of content?.media?.carouselOrder || []) {
    const project = (content.media.works || []).find(
      (item) => item.id === projectId,
    )
    if (!desktopIds.has(projectId) || !mobileIds.has(projectId))
      errors.push(
        `${project?.client || "A carousel project"} needs both desktop and mobile clips before publishing.`,
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
  if (!env.PUBLIC_SITE_URL || !env.REVALIDATE_SECRET) return { skipped: true }
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
      revisionId: draft.revision_id,
      updatedAt: draft.updated_at,
      updatedBy: draft.updated_by,
    },
    publishedRevisionId: published?.revision_id || null,
    revisions: revisions.results,
    jobs: jobs.results,
  })
}

async function saveDraft(request, env, email) {
  const content = await request.json()
  normalizeCarousel(content)
  const errors = validateContent(content).filter(
    (error) =>
      !error.includes("missing a ready main video") &&
      !error.includes("needs both desktop and mobile clips") &&
      !error.includes("homepage carousel needs") &&
      !error.includes("has an incomplete") &&
      !error.includes("needs carousel approval"),
  )
  if (errors.length) return json({ error: "Draft is invalid.", errors }, 400)
  content.updatedAt = now()
  await env.DB.prepare(
    "UPDATE content_documents SET content_json = ?, updated_at = ?, updated_by = ? WHERE key = 'draft'",
  )
    .bind(JSON.stringify(content), content.updatedAt, email)
    .run()
  return json({ savedAt: content.updatedAt })
}

async function createPreview(env) {
  const draft = await readDocument(env, "draft")
  const token = crypto.randomUUID()
  await env.MEDIA.put(
    cmsKey(env, `previews/${token}.json`),
    JSON.stringify(draft.content),
    {
      customMetadata: {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      httpMetadata: {
        contentType: "application/json",
        cacheControl: "private, max-age=60",
      },
    },
  )
  const signature = await hmacHex(env.PREVIEW_SECRET, token)
  const site = env.PUBLIC_SITE_URL.replace(/\/$/, "")
  return json({
    url: `${site}/api/cms-preview?token=${encodeURIComponent(token)}&signature=${signature}`,
  })
}

async function publish(env, email) {
  const draft = await readDocument(env, "draft")
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
  const versionKey = cmsKey(env, `published/revisions/${revisionId}.json`)
  await env.MEDIA.put(versionKey, serialized, {
    httpMetadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=31536000, immutable",
    },
  })
  await env.MEDIA.put(cmsKey(env, "published/current.json"), serialized, {
    httpMetadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=60",
    },
  })
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE revisions SET is_published = 0 WHERE is_published = 1",
    ),
    env.DB.prepare(
      "INSERT INTO revisions (id, content_json, label, created_at, created_by, is_published) VALUES (?, ?, ?, ?, ?, 1)",
    ).bind(
      revisionId,
      serialized,
      `Published ${new Date(timestamp).toLocaleString("en-CA")}`,
      timestamp,
      email,
    ),
    env.DB.prepare(
      "UPDATE content_documents SET content_json = ?, revision_id = ?, updated_at = ?, updated_by = ? WHERE key = 'published'",
    ).bind(serialized, revisionId, timestamp, email),
    env.DB.prepare(
      "UPDATE content_documents SET revision_id = ?, updated_at = ?, updated_by = ? WHERE key = 'draft'",
    ).bind(revisionId, timestamp, email),
  ])

  let propagation = "complete"
  try {
    await revalidate(
      env,
      draft.content.media.works.map((project) => project.id),
    )
  } catch (error) {
    propagation = error.message
  }
  return json({ revisionId, publishedAt: timestamp, propagation })
}

async function restoreRevision(env, email, id) {
  const revision = await env.DB.prepare(
    "SELECT content_json FROM revisions WHERE id = ?",
  )
    .bind(id)
    .first()
  if (!revision) return json({ error: "Revision not found." }, 404)
  await env.DB.prepare(
    "UPDATE content_documents SET content_json = ?, updated_at = ?, updated_by = ? WHERE key = 'draft'",
  )
    .bind(revision.content_json, now(), email)
    .run()
  return json({ restored: id })
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
      Bucket: env.R2_BUCKET_NAME,
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
  if (!size || size > MAX_UPLOAD_BYTES)
    return json({ error: "File is empty or larger than 80 GB." }, 400)
  const jobId = crypto.randomUUID()
  const projectId = String(input.projectId || "").trim()
  if (!projectId)
    return json({ error: "Save the project before uploading media." }, 400)
  const key = cmsKey(
    env,
    `originals/${projectId}/${role}/${jobId}-${safeName(input.fileName)}`,
  )
  const created = await env.MEDIA.createMultipartUpload(key, {
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
  const part = await env.MEDIA.resumeMultipartUpload(key, uploadId).uploadPart(
    partNumber,
    request.body,
  )
  return new Response(null, {
    status: 200,
    headers: { etag: part.etag, "cache-control": "no-store" },
  })
}

async function completeUpload(request, env) {
  const { uploadId, key, jobId, parts } = await request.json()
  await env.MEDIA.resumeMultipartUpload(key, uploadId).complete(
    parts.map((part) => ({
      etag: part.etag,
      partNumber: part.partNumber,
    })),
  )
  const job = await env.DB.prepare(
    "SELECT asset_role, mime_type FROM processing_jobs WHERE id = ?",
  )
    .bind(jobId)
    .first()
  const status = IMAGE_ROLES.has(job?.asset_role) ? "ready" : "waiting"
  await env.DB.prepare(
    "UPDATE processing_jobs SET status = ?, progress = ?, updated_at = ? WHERE id = ?",
  )
    .bind(status, status === "ready" ? 100 : 0, now(), jobId)
    .run()
  if (status === "ready") await attachImageToDraft(env, jobId)
  return json({ jobId, status })
}

async function abortUpload(request, env) {
  const { uploadId, key, jobId } = await request.json()
  await env.MEDIA.resumeMultipartUpload(key, uploadId).abort()
  await env.DB.prepare(
    "UPDATE processing_jobs SET status = 'error', error = ?, updated_at = ? WHERE id = ?",
  )
    .bind("Upload cancelled", now(), jobId)
    .run()
  return json({ aborted: jobId })
}

async function attachImageToDraft(env, jobId) {
  const job = await env.DB.prepare("SELECT * FROM processing_jobs WHERE id = ?")
    .bind(jobId)
    .first()
  if (!job) return
  const draft = await readDocument(env, "draft")
  const project = draft.content.media.works.find(
    (item) => item.id === job.project_id,
  )
  if (project && job.asset_role === "poster") {
    project.poster = {
      src: `${env.R2_PUBLIC_BASE_URL}/${job.object_key}`,
      width: 1920,
      height: 1080,
    }
  }
  const person = [
    ...draft.content.editorial.people.leadership,
    ...draft.content.editorial.people.extended,
  ].find((item) => item.id === job.project_id)
  if (person && ["head", "mask"].includes(job.asset_role))
    person[job.asset_role] = `${env.R2_PUBLIC_BASE_URL}/${job.object_key}`
  await env.DB.prepare(
    "UPDATE content_documents SET content_json = ?, updated_at = ? WHERE key = 'draft'",
  )
    .bind(JSON.stringify(draft.content), now())
    .run()
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
  const local = ["localhost", "127.0.0.1"].includes(requestUrl.hostname)
  const downloadUrl = String(job.object_key).startsWith("external:")
    ? atob(String(job.object_key).slice("external:".length))
    : local
      ? `${requestUrl.origin}/api/processor/jobs/${job.id}/original`
      : await getSignedUrl(
          s3Client(env),
          new GetObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: job.object_key,
          }),
          { expiresIn: 60 * 60 },
        )
  return json({
    job: {
      ...job,
      status: "processing",
      lease_until: leaseUntil,
      downloadUrl,
      options: JSON.parse(job.options_json || "{}"),
      outputPrefix: `videos/${job.project_id}/${job.asset_role}/${job.id}`,
    },
  })
}

async function processorOriginal(env, id) {
  const job = await env.DB.prepare(
    "SELECT object_key, mime_type FROM processing_jobs WHERE id = ?",
  )
    .bind(id)
    .first()
  if (!job || String(job.object_key).startsWith("external:"))
    return json({ error: "Original not found." }, 404)
  const object = await env.MEDIA.get(job.object_key)
  if (!object) return json({ error: "Original not found." }, 404)
  return new Response(object.body, {
    headers: {
      "content-type": job.mime_type || "application/octet-stream",
      "content-length": String(object.size),
      "cache-control": "no-store",
    },
  })
}

async function processorUploadUrl(request, env, id) {
  const { key, contentType, contentLength, cacheControl } = await request.json()
  const job = await env.DB.prepare(
    "SELECT project_id, asset_role FROM processing_jobs WHERE id = ?",
  )
    .bind(id)
    .first()
  if (
    !job ||
    !String(key).startsWith(`videos/${job.project_id}/${job.asset_role}/`)
  )
    return json({ error: "Invalid output key." }, 400)
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

async function updateProcessorJob(request, env, id, action) {
  const input = await request.json().catch(() => ({}))
  const timestamp = now()
  if (action === "progress") {
    const progress = Math.max(0, Math.min(99, Number(input.progress || 0)))
    await env.DB.prepare(
      "UPDATE processing_jobs SET progress = ?, lease_until = ?, updated_at = ? WHERE id = ?",
    )
      .bind(
        progress,
        new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        timestamp,
        id,
      )
      .run()
    return json({ progress })
  }
  if (action === "error") {
    await env.DB.prepare(
      "UPDATE processing_jobs SET status = 'error', error = ?, lease_until = NULL, updated_at = ? WHERE id = ?",
    )
      .bind(
        String(input.error || "Processing failed").slice(0, 1000),
        timestamp,
        id,
      )
      .run()
    return json({ status: "error" })
  }

  const job = await env.DB.prepare("SELECT * FROM processing_jobs WHERE id = ?")
    .bind(id)
    .first()
  if (!job) return json({ error: "Job not found." }, 404)
  const draft = await readDocument(env, "draft")
  normalizeCarousel(draft.content)
  const baseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")
  const project = draft.content.media.works.find(
    (item) => item.id === job.project_id,
  )
  if (!project) return json({ error: "Project no longer exists." }, 409)
  const output = input.output || {}
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
      poster: project.poster,
    }
    if (entry) Object.assign(entry, clip)
    else clips.push(clip)
    normalizeCarousel(draft.content)
  }
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE content_documents SET content_json = ?, updated_at = ? WHERE key = 'draft'",
    ).bind(JSON.stringify(draft.content), timestamp),
    env.DB.prepare(
      "UPDATE processing_jobs SET status = 'ready', progress = 100, lease_until = NULL, updated_at = ? WHERE id = ?",
    ).bind(timestamp, id),
  ])
  return json({ status: "ready" })
}

async function routeApi(request, env, email) {
  const url = new URL(request.url)
  const path = url.pathname
  if (path === "/api/bootstrap" && request.method === "GET")
    return bootstrap(env, email)
  if (path === "/api/draft" && request.method === "PUT")
    return saveDraft(request, env, email)
  if (path === "/api/preview" && request.method === "POST")
    return createPreview(env)
  if (path === "/api/publish" && request.method === "POST")
    return publish(env, email)
  if (
    path.startsWith("/api/revisions/") &&
    path.endsWith("/restore") &&
    request.method === "POST"
  ) {
    return restoreRevision(env, email, path.split("/")[3])
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
      !(await env.MEDIA.head(job.object_key))
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
    /^\/api\/processor\/jobs\/([^/]+)\/(upload-url|progress|complete|error)$/,
  )
  if (!match || request.method !== "POST")
    return json({ error: "Not found" }, 404)
  if (match[2] === "upload-url")
    return processorUploadUrl(request, env, match[1])
  return updateProcessorJob(request, env, match[1], match[2])
}

const worker = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      if (url.pathname.startsWith("/api/processor/")) {
        if (!isProcessor(request, env))
          return json({ error: "Unauthorized" }, 401)
        await ensureSchema(env)
        return routeProcessor(request, env)
      }
      if (url.pathname.startsWith("/api/")) {
        const email = allowedEmail(request, env)
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
