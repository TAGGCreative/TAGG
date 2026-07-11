import "dotenv/config"

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { spawn } from "node:child_process"
import { createReadStream } from "node:fs"
import {
  access,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const CATALOG_PATH = path.join(ROOT, "content", "media-catalog.json")
const WORK_DIR = path.join(ROOT, ".media-work")
const PROGRESS_PATH = path.join(WORK_DIR, "progress.json")
const DRY_RUN = process.argv.includes("--dry-run")
const CHECK_SOURCE = process.argv.includes("--check-source")
const KEEP_SOURCE = process.argv.includes("--keep-source")
const LIMIT = Number(
  process.argv
    .find((argument) => argument.startsWith("--limit="))
    ?.split("=")[1] || Infinity,
)

const required = DRY_RUN
  ? CHECK_SOURCE
    ? ["ACCESS_TOKEN"]
    : []
  : [
      "ACCESS_TOKEN",
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ]
const missing = required.filter((key) => !process.env[key])
if (missing.length)
  throw new Error(`Missing environment variables: ${missing.join(", ")}`)

const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") || ""
const renditions = [
  { height: 1080, bitrate: "12M", buffer: "24M", bandwidth: 12700000 },
  { height: 720, bitrate: "6M", buffer: "12M", bandwidth: 6700000 },
  { height: 540, bitrate: "3500k", buffer: "7M", bandwidth: 4200000 },
]

const s3 = DRY_RUN
  ? null
  : new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "inherit", "inherit"],
    })
    child.on("error", reject)
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with code ${code}`)),
    )
  })
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      `Vimeo request failed (${response.status}): ${body?.error || response.statusText}`,
    )
  return body
}

async function getVimeoSource(vimeoId) {
  const fields = encodeURIComponent(
    "uri,name,player_embed_url,privacy.download,download,files,play",
  )
  const video = await fetchJson(
    `https://api.vimeo.com/videos/${vimeoId}?fields=${fields}`,
  )
  const candidates = [
    ...(video.download || []),
    ...(video.files || []),
    ...(video.play?.progressive || []),
  ].filter((file) => file.link)
  const selected =
    candidates.find((file) => file.quality === "source") ||
    candidates.sort((a, b) => (b.size || 0) - (a.size || 0))[0]

  if (selected) return { name: video.name || vimeoId, url: selected.link }
  if (video.play?.status === "playable") {
    return {
      name: video.name || vimeoId,
      playbackUrl:
        video.player_embed_url || `https://player.vimeo.com/video/${vimeoId}`,
    }
  }
  throw new Error(`Vimeo video ${vimeoId} is not available for playback.`)
}

function catalogEntries(catalog) {
  return [
    ...catalog.works.map((entry) => ({ entry, collection: "works" })),
    ...catalog.carousels.desktop.map((entry) => ({
      entry,
      collection: "carousel-desktop",
    })),
    ...catalog.carousels.mobile.map((entry) => ({
      entry,
      collection: "carousel-mobile",
    })),
  ]
}

async function downloadSource(item, url) {
  const target = path.join(WORK_DIR, item.vimeoId, "source.mp4")
  await mkdir(path.dirname(target), { recursive: true })
  try {
    if ((await stat(target)).size > 0) return target
  } catch {}

  const response = await fetch(url)
  if (!response.ok || !response.body)
    throw new Error(`Source download failed (${response.status})`)
  const temporary = `${target}.partial`
  const file = await import("node:fs").then(({ createWriteStream }) =>
    createWriteStream(temporary),
  )
  await import("node:stream/promises").then(({ pipeline }) =>
    pipeline(response.body, file),
  )
  await import("node:fs/promises").then(({ rename }) =>
    rename(temporary, target),
  )
  return target
}

async function downloadPlaybackRendition(item, playbackUrl) {
  const target = path.join(WORK_DIR, item.vimeoId, "source.mp4")
  await mkdir(path.dirname(target), { recursive: true })
  try {
    if ((await stat(target)).size > 0) return target
  } catch {}

  console.log("  Downloading the best Vimeo playback rendition…")
  await run("yt-dlp", [
    "--quiet",
    "--no-playlist",
    "--referer",
    "https://taggcreative.com/",
    "--format",
    "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
    "--merge-output-format",
    "mp4",
    "--output",
    target,
    playbackUrl,
  ])
  return target
}

async function probeVideo(source) {
  let output = ""
  await new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "json",
      source,
    ])
    child.stdout.on("data", (chunk) => (output += chunk))
    child.stderr.pipe(process.stderr)
    child.on("error", reject)
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("ffprobe failed")),
    )
  })
  return JSON.parse(output).streams[0]
}

async function encodeHls(item, source) {
  const output = path.join(WORK_DIR, item.vimeoId, "hls")
  const probe = await probeVideo(source)
  const profiles = renditions.filter(
    (profile) => profile.height <= probe.height,
  )
  if (!profiles.length) profiles.push(renditions.at(-1))

  for (const profile of profiles) {
    const directory = path.join(output, `${profile.height}p`)
    const playlist = path.join(directory, "index.m3u8")
    const completeMarker = path.join(directory, ".complete")
    try {
      await access(completeMarker)
      continue
    } catch {}
    await rm(directory, { recursive: true, force: true })
    await mkdir(directory, { recursive: true })
    const targetHeight = Math.min(profile.height, probe.height)
    const preserveTopRendition = targetHeight === probe.height
    console.log(
      `  ${preserveTopRendition ? "Packaging" : "Encoding"} ${targetHeight}p…`,
    )
    const videoArguments = preserveTopRendition
      ? ["-c:v", "copy"]
      : [
          "-vf",
          `scale=-2:${targetHeight}`,
          "-c:v",
          "libx264",
          "-preset",
          "medium",
          "-crf",
          "18",
          "-maxrate",
          profile.bitrate,
          "-bufsize",
          profile.buffer,
          "-pix_fmt",
          "yuv420p",
          "-profile:v",
          "high",
          "-force_key_frames",
          "expr:gte(t,n_forced*6)",
          "-sc_threshold",
          "0",
        ]
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      source,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      ...videoArguments,
      "-c:a",
      "copy",
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_flags",
      "independent_segments",
      "-hls_segment_type",
      "fmp4",
      "-hls_fmp4_init_filename",
      "init.mp4",
      "-hls_segment_filename",
      path.join(directory, "segment_%05d.m4s"),
      playlist,
    ])
    await writeFile(completeMarker, "")
  }

  const aspect = probe.width / probe.height
  const master = ["#EXTM3U", "#EXT-X-VERSION:7"]
  for (const profile of profiles) {
    const height = Math.min(profile.height, probe.height)
    const width = Math.round((height * aspect) / 2) * 2
    master.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${profile.bandwidth},RESOLUTION=${width}x${height}`,
      `${profile.height}p/index.m3u8`,
    )
  }
  await writeFile(path.join(output, "master.m3u8"), `${master.join("\n")}\n`)
  return output
}

function contentType(file) {
  if (file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl"
  if (file.endsWith(".m4s")) return "video/iso.segment"
  if (file.endsWith(".mp4")) return "video/mp4"
  return "application/octet-stream"
}

async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".complete") continue
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

async function uploadHls(item, directory) {
  const files = await walk(directory)
  const concurrency = 6
  for (let offset = 0; offset < files.length; offset += concurrency) {
    const batch = files.slice(offset, offset + concurrency)
    await Promise.all(
      batch.map((file) => {
        const relative = path
          .relative(directory, file)
          .split(path.sep)
          .join("/")
        return s3.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `videos/${item.vimeoId}/${relative}`,
            Body: createReadStream(file),
            ContentType: contentType(file),
            CacheControl: file.endsWith(".m3u8")
              ? "public, max-age=60"
              : "public, max-age=31536000, immutable",
          }),
        )
      }),
    )
    process.stdout.write(
      `\r  Uploading ${Math.min(offset + concurrency, files.length)}/${files.length}`,
    )
  }
  process.stdout.write("\n")
}

async function readProgress() {
  try {
    return JSON.parse(await readFile(PROGRESS_PATH, "utf8"))
  } catch {
    return { uploaded: {} }
  }
}

async function saveProgress(progress) {
  await mkdir(WORK_DIR, { recursive: true })
  await writeFile(PROGRESS_PATH, `${JSON.stringify(progress, null, 2)}\n`)
}

function switchCatalog(catalog, vimeoId) {
  if (!publicBaseUrl) return
  for (const { entry } of catalogEntries(catalog)) {
    if (entry.source?.provider === "vimeo" && entry.source.id === vimeoId) {
      entry.source = {
        provider: "hls",
        url: `${publicBaseUrl}/videos/${vimeoId}/master.m3u8`,
        legacyVimeoId: vimeoId,
      }
    }
  }
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"))
  const seen = new Set()
  const pending = catalogEntries(catalog)
    .filter(({ entry }) => {
      if (entry.source?.provider !== "vimeo" || seen.has(entry.source.id))
        return false
      seen.add(entry.source.id)
      return true
    })
    .map(({ entry, collection }) => ({
      vimeoId: entry.source.id,
      name: `${entry.client} — ${entry.title}`,
      collection,
    }))
    .slice(0, LIMIT)

  console.log(
    `${DRY_RUN ? "Would migrate" : "Migrating"} ${pending.length} unique Vimeo videos to R2 HLS.`,
  )
  const progress = await readProgress()
  for (const [index, item] of pending.entries()) {
    console.log(
      `[${index + 1}/${pending.length}] ${item.name} (${item.vimeoId})`,
    )
    if (DRY_RUN) {
      if (CHECK_SOURCE) await getVimeoSource(item.vimeoId)
      continue
    }
    if (progress.uploaded[item.vimeoId]) {
      console.log("  Already uploaded; skipping.")
      switchCatalog(catalog, item.vimeoId)
      continue
    }
    const remote = await getVimeoSource(item.vimeoId)
    const source = remote.url
      ? await downloadSource(item, remote.url)
      : await downloadPlaybackRendition(item, remote.playbackUrl)
    const hls = await encodeHls(item, source)
    await uploadHls(item, hls)
    progress.uploaded[item.vimeoId] = { completedAt: new Date().toISOString() }
    await saveProgress(progress)
    switchCatalog(catalog, item.vimeoId)
    await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
    if (!KEEP_SOURCE)
      await rm(path.dirname(source), { recursive: true, force: true })
  }

  if (!DRY_RUN && publicBaseUrl) {
    catalog.generatedAt = new Date().toISOString()
    await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
    console.log(`Migration catalog switched to ${publicBaseUrl}.`)
  } else if (!DRY_RUN) {
    console.log(
      "Uploads complete, but the catalog was not switched because R2_PUBLIC_BASE_URL is unset.",
    )
  }
}

await main()
