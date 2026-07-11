import "dotenv/config"

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { spawn } from "node:child_process"
import { createReadStream } from "node:fs"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const CATALOG_PATH = path.join(ROOT, "content", "media-catalog.json")
const WORK_DIR = path.join(ROOT, ".media-work", "startup-renditions")
const PROGRESS_PATH = path.join(WORK_DIR, "progress.json")
const LIMIT = Number(
  process.argv
    .find((argument) => argument.startsWith("--limit="))
    ?.split("=")[1] || Infinity,
)

const required = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
]
const missing = required.filter((key) => !process.env[key])
if (missing.length)
  throw new Error(`Missing environment variables: ${missing.join(", ")}`)

const s3 = new S3Client({
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

async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

async function readProgress() {
  try {
    return JSON.parse(await readFile(PROGRESS_PATH, "utf8"))
  } catch {
    return { completed: {} }
  }
}

async function saveProgress(progress) {
  await mkdir(WORK_DIR, { recursive: true })
  await writeFile(PROGRESS_PATH, `${JSON.stringify(progress, null, 2)}\n`)
}

function catalogEntries(catalog) {
  return [
    ...catalog.works,
    ...catalog.carousels.desktop,
    ...catalog.carousels.mobile,
  ]
}

async function encode360(item, directory) {
  await rm(directory, { recursive: true, force: true })
  await mkdir(directory, { recursive: true })
  const source = item.source.url.replace(/master\.m3u8$/, "540p/index.m3u8")

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
    "-vf",
    "scale=-2:360",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-maxrate",
    "1400k",
    "-bufsize",
    "2800k",
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "high",
    "-force_key_frames",
    "expr:gte(t,n_forced*2)",
    "-sc_threshold",
    "0",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-f",
    "hls",
    "-hls_time",
    "2",
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
    path.join(directory, "index.m3u8"),
  ])
  return probeVideo(path.join(directory, "index.m3u8"))
}

async function upload360(item, directory) {
  const files = await walk(directory)
  for (const file of files) {
    const name = path.basename(file)
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `videos/${item.id}/360p/${name}`,
        Body: createReadStream(file),
        ContentType: name.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : name.endsWith(".m4s")
            ? "video/iso.segment"
            : "video/mp4",
        CacheControl: name.endsWith(".m3u8")
          ? "public, max-age=60"
          : "public, max-age=31536000, immutable",
      }),
    )
  }
}

async function updateMaster(item, dimensions) {
  const response = await fetch(item.source.url, { cache: "no-store" })
  if (!response.ok)
    throw new Error(`Master playlist request failed (${response.status})`)
  let master = await response.text()
  master = master.replace(
    /#EXT-X-STREAM-INF:[^\n]*\n360p\/index\.m3u8\n?/g,
    "",
  )
  master = `${master.trim()}\n#EXT-X-STREAM-INF:BANDWIDTH=1600000,RESOLUTION=${dimensions.width}x${dimensions.height}\n360p/index.m3u8\n`
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `videos/${item.id}/master.m3u8`,
      Body: master,
      ContentType: "application/vnd.apple.mpegurl",
      CacheControl: "public, max-age=60",
    }),
  )
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"))
  const seen = new Set()
  const items = catalogEntries(catalog)
    .filter((entry) => {
      const id = entry.source?.legacyVimeoId || entry.source?.id
      if (entry.source?.provider !== "hls" || !id || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((entry) => ({
      id: entry.source.legacyVimeoId || entry.source.id,
      name: `${entry.client} — ${entry.title}`,
      source: entry.source,
    }))
    .slice(0, LIMIT)

  const progress = await readProgress()
  console.log(`Adding 360p startup renditions to ${items.length} videos.`)
  for (const [index, item] of items.entries()) {
    console.log(`[${index + 1}/${items.length}] ${item.name} (${item.id})`)
    if (progress.completed[item.id]) {
      const source360 = item.source.url.replace(
        /master\.m3u8$/,
        "360p/index.m3u8",
      )
      const dimensions = await probeVideo(source360)
      await updateMaster(item, dimensions)
      console.log("  Rendition complete; master dimensions verified.")
      continue
    }
    const directory = path.join(WORK_DIR, item.id, "360p")
    const dimensions = await encode360(item, directory)
    await upload360(item, directory)
    await updateMaster(item, dimensions)
    progress.completed[item.id] = { completedAt: new Date().toISOString() }
    await saveProgress(progress)
    await rm(path.join(WORK_DIR, item.id), { recursive: true, force: true })
  }
}

await main()
