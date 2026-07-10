import "dotenv/config"

import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const CATALOG_PATH = path.join(ROOT, "content", "media-catalog.json")
const POSTER_DIR = path.join(ROOT, "public", "media", "posters")
const PREVIEW_DIR = path.join(ROOT, "public", "media", "previews")

const SHOWCASES = {
  works: process.env.VIMEO_WORKS_SHOWCASE_ID || "8478566",
  mobile: process.env.VIMEO_MOBILE_SHOWCASE_ID || "8493940",
  desktop: process.env.VIMEO_DESKTOP_SHOWCASE_ID || "8493934",
}

const requiredEnvironment = ["ACCESS_TOKEN", "TAGG_ID"]
const missingEnvironment = requiredEnvironment.filter(
  (key) => !process.env[key],
)

if (missingEnvironment.length) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironment.join(", ")}`,
  )
}

async function readExistingCatalog() {
  try {
    return JSON.parse(await readFile(CATALOG_PATH, "utf8"))
  } catch {
    return null
  }
}

async function vimeoRequest(requestPath) {
  const response = await fetch(`https://api.vimeo.com${requestPath}`, {
    headers: {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Vimeo request failed (${response.status}): ${body}`)
  }

  return response.json()
}

async function getShowcaseVideos(showcaseId, fields) {
  const videos = []
  let requestPath = `/users/${process.env.TAGG_ID}/albums/${showcaseId}/videos?sort=manual&per_page=100&fields=${fields}`

  while (requestPath) {
    const response = await vimeoRequest(requestPath)
    videos.push(...(response.data || []))
    requestPath = response.paging?.next || null
  }

  return videos
}

function parseDescription(description, fallback = {}) {
  try {
    const parsed = JSON.parse(description || "{}")
    return parsed && typeof parsed === "object" ? parsed : fallback
  } catch {
    return fallback
  }
}

function getVimeoId(uri) {
  return String(uri || "")
    .split("/")
    .filter(Boolean)
    .at(-1)
}

function selectPoster(sizes = []) {
  return (
    sizes.find((image) => image.width >= 960) ||
    sizes.find((image) => image.width >= 640) ||
    sizes.at(-1) ||
    null
  )
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function downloadPoster(videoId, poster) {
  if (!poster?.link) return null

  const localPath = path.join(POSTER_DIR, `${videoId}.jpg`)
  if (!(await fileExists(localPath))) {
    const response = await fetch(poster.link)
    if (!response.ok) {
      throw new Error(
        `Poster download failed for ${videoId}: ${response.status}`,
      )
    }
    await writeFile(localPath, Buffer.from(await response.arrayBuffer()))
  }

  return {
    src: `/media/posters/${videoId}.jpg`,
    width: poster.width,
    height: poster.height,
  }
}

async function getPreview(videoId) {
  const mp4Path = path.join(PREVIEW_DIR, `preview_${videoId}.mp4`)
  const webmPath = path.join(PREVIEW_DIR, `preview_${videoId}.webm`)
  const [hasMp4, hasWebm] = await Promise.all([
    fileExists(mp4Path),
    fileExists(webmPath),
  ])

  if (!hasMp4 && !hasWebm) return null

  return {
    provider: "static",
    ...(hasMp4 ? { mp4: `/media/previews/preview_${videoId}.mp4` } : {}),
    ...(hasWebm ? { webm: `/media/previews/preview_${videoId}.webm` } : {}),
  }
}

function preserveSource(existingCatalog, collection, vimeoId) {
  const entries =
    collection === "works"
      ? existingCatalog?.works
      : existingCatalog?.carousels?.[collection]
  const existing = entries?.find(
    (entry) =>
      entry.source?.legacyVimeoId === vimeoId ||
      (entry.source?.provider === "vimeo" && entry.source.id === vimeoId),
  )

  return existing?.source?.provider === "cloudflare"
    ? existing.source
    : { provider: "vimeo", id: vimeoId }
}

async function buildWork(video, existingCatalog) {
  const id = getVimeoId(video.uri)
  const description = parseDescription(video.description, {
    client: "Unknown client",
    title: video.name || "Untitled",
  })
  const poster = await downloadPoster(id, selectPoster(video.pictures?.sizes))

  return {
    id,
    source: preserveSource(existingCatalog, "works", id),
    client: description.client ?? description.Client ?? "Unknown client",
    title: description.title ?? description.Title ?? video.name ?? "Untitled",
    credits: Object.fromEntries(
      Object.entries(description).filter(
        ([key]) => !["id", "client", "Client", "title", "Title"].includes(key),
      ),
    ),
    poster,
    preview: await getPreview(id),
  }
}

async function buildCarouselClip(video, collection, existingCatalog) {
  const id = getVimeoId(video.uri)
  const description = parseDescription(video.description, {
    client: "Unknown client",
    title: video.name || "Untitled",
  })

  return {
    id,
    projectId: String(description.id || ""),
    source: preserveSource(existingCatalog, collection, id),
    client: description.client ?? description.Client ?? "Unknown client",
    title: description.title ?? description.Title ?? video.name ?? "Untitled",
    poster: await downloadPoster(id, selectPoster(video.pictures?.sizes)),
  }
}

async function main() {
  await Promise.all([
    mkdir(path.dirname(CATALOG_PATH), { recursive: true }),
    mkdir(POSTER_DIR, { recursive: true }),
    mkdir(PREVIEW_DIR, { recursive: true }),
  ])

  const existingCatalog = await readExistingCatalog()
  const fields = "uri,name,description,pictures.sizes"
  const [workVideos, mobileVideos, desktopVideos] = await Promise.all([
    getShowcaseVideos(SHOWCASES.works, fields),
    getShowcaseVideos(SHOWCASES.mobile, fields),
    getShowcaseVideos(SHOWCASES.desktop, fields),
  ])

  const [works, mobile, desktop] = await Promise.all([
    Promise.all(workVideos.map((video) => buildWork(video, existingCatalog))),
    Promise.all(
      mobileVideos.map((video) =>
        buildCarouselClip(video, "mobile", existingCatalog),
      ),
    ),
    Promise.all(
      desktopVideos.map((video) =>
        buildCarouselClip(video, "desktop", existingCatalog),
      ),
    ),
  ])

  const catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    cloudflare: existingCatalog?.cloudflare || {
      customerCode: "",
      allowedOrigins: ["taggcreative.com", "www.taggcreative.com"],
    },
    works,
    carousels: { desktop, mobile },
  }

  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(
    `Saved ${works.length} works and ${desktop.length + mobile.length} carousel clips to ${CATALOG_PATH}`,
  )
}

await main()
