import "dotenv/config"

import { spawn } from "node:child_process"
import { createReadStream } from "node:fs"
import { access, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { pipeline } from "node:stream/promises"

const API = process.env.CMS_API_URL?.replace(/\/$/, "")
const TOKEN = process.env.CMS_PROCESSOR_TOKEN
const WORK_ROOT = path.join(process.cwd(), ".cms-media-work")
const ONCE = process.argv.includes("--once")
const SELF_TEST = process.argv.includes("--self-test")
const POLL_MS = 20_000

if (!SELF_TEST && (!API || !TOKEN))
  throw new Error("CMS_API_URL and CMS_PROCESSOR_TOKEN are required.")

const profiles = [
  { height: 1080, bitrate: "12M", buffer: "24M", bandwidth: 12_700_000 },
  { height: 720, bitrate: "6M", buffer: "12M", bandwidth: 6_700_000 },
  { height: 540, bitrate: "3500k", buffer: "7M", bandwidth: 4_200_000 },
  { height: 360, bitrate: "1400k", buffer: "2800k", bandwidth: 1_600_000 },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function api(endpoint, options = {}) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
          ...(options.headers || {}),
        },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok)
        throw new Error(data.error || `CMS request failed (${response.status})`)
      return data
    } catch (error) {
      lastError = error
      if (attempt < 3) await sleep(attempt * 1500)
    }
  }
  throw lastError
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] })
    let errorOutput = ""
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk
      if (errorOutput.length > 8000) errorOutput = errorOutput.slice(-8000)
    })
    child.on("error", reject)
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} failed: ${errorOutput.trim()}`)),
    )
  })
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] })
    let output = ""
    let errorOutput = ""
    child.stdout.on("data", (chunk) => (output += chunk))
    child.stderr.on("data", (chunk) => (errorOutput += chunk))
    child.on("error", reject)
    child.on("exit", (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`${command} failed: ${errorOutput.trim()}`)),
    )
  })
}

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function download(job, target) {
  const isHls =
    job.mime_type === "application/vnd.apple.mpegurl" ||
    String(job.downloadUrl).includes(".m3u8")
  if (isHls) {
    if ((await exists(target)) && (await stat(target)).size > 0) return
    const partial = `${target}.partial`
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      job.downloadUrl,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      "-f",
      "mp4",
      partial,
    ])
    await (await import("node:fs/promises")).rename(partial, target)
    return
  }
  if (
    (await exists(target)) &&
    (await stat(target)).size === Number(job.size_bytes)
  )
    return
  const partial = `${target}.partial`
  const localProcessorDownload = String(job.downloadUrl).startsWith(
    `${API}/api/processor/`,
  )
  const response = await fetch(job.downloadUrl, {
    headers: localProcessorDownload
      ? { authorization: `Bearer ${TOKEN}` }
      : undefined,
  })
  if (!response.ok || !response.body)
    throw new Error(`Original download failed (${response.status})`)
  await pipeline(
    response.body,
    (await import("node:fs")).createWriteStream(partial),
  )
  await (await import("node:fs/promises")).rename(partial, target)
}

async function probe(source) {
  const output = await capture("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height:format=duration",
    "-of",
    "json",
    source,
  ])
  const data = JSON.parse(output)
  return { ...data.streams[0], duration: Number(data.format.duration || 0) }
}

async function detectSceneTimes(source, duration) {
  if (duration <= 16) return [0]
  return new Promise((resolve) => {
    const child = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-i",
        source,
        "-an",
        "-vf",
        "select='gt(scene,0.30)',showinfo",
        "-f",
        "null",
        "-",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    )
    let output = ""
    child.stderr.on("data", (chunk) => {
      output += chunk
      if (output.length > 2_000_000) output = output.slice(-2_000_000)
    })
    child.on("error", () => resolve([0]))
    child.on("exit", () => {
      const times = [0]
      for (const match of output.matchAll(/pts_time:([0-9.]+)/g)) {
        const value = Number(match[1])
        if (
          Number.isFinite(value) &&
          value > 0.35 &&
          value < duration - 0.7 &&
          value - times.at(-1) > 0.65
        )
          times.push(value)
      }
      resolve(times)
    })
  })
}

function chooseHighlightSegments(sceneTimes, duration) {
  if (duration <= 15) return [{ start: 0, duration }]
  const segmentDuration = 1.55
  const desired = Math.min(9, Math.max(5, Math.floor(duration / 6)))
  const candidates = sceneTimes
    .filter((time) => time > 0.75)
    .map((time) =>
      Math.min(Math.max(0, time + 0.18), duration - segmentDuration),
    )
    .filter(
      (time, index, values) => index === 0 || time - values[index - 1] > 0.7,
    )
  if (candidates.length < desired) {
    for (let index = 0; index < desired * 2; index += 1) {
      const time =
        ((index + 0.65) / (desired * 2)) * (duration - segmentDuration)
      if (candidates.every((candidate) => Math.abs(candidate - time) > 1.25))
        candidates.push(time)
    }
    candidates.sort((a, b) => a - b)
  }
  if (candidates.length <= desired)
    return candidates.map((start) => ({ start, duration: segmentDuration }))
  return Array.from({ length: desired }, (_, index) => {
    const candidateIndex = Math.round(
      (index * (candidates.length - 1)) / Math.max(1, desired - 1),
    )
    return { start: candidates[candidateIndex], duration: segmentDuration }
  })
}

async function createAutoHighlight(source, target, dimensions) {
  const scenes = await detectSceneTimes(source, dimensions.duration)
  const segments = chooseHighlightSegments(scenes, dimensions.duration)
  if (await exists(target)) return segments
  const args = ["-hide_banner", "-loglevel", "error", "-y"]
  for (const segment of segments)
    args.push(
      "-ss",
      segment.start.toFixed(3),
      "-t",
      segment.duration.toFixed(3),
      "-i",
      source,
    )
  const inputs = segments
    .map((_, index) => `[${index}:v:0]setpts=PTS-STARTPTS[v${index}]`)
    .join(";")
  const concat = segments.map((_, index) => `[v${index}]`).join("")
  args.push(
    "-filter_complex",
    `${inputs};${concat}concat=n=${segments.length}:v=1:a=0,format=yuv420p[outv]`,
    "-map",
    "[outv]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-movflags",
    "+faststart",
    target,
  )
  await run("ffmpeg", args)
  return segments
}

async function createCarouselClips(source, directory, segments) {
  await mkdir(directory, { recursive: true })
  const files = []
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const file = path.join(
      directory,
      `clip-${String(index + 1).padStart(2, "0")}.mp4`,
    )
    files.push(file)
    if (await exists(file)) continue
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      segment.start.toFixed(3),
      "-t",
      segment.duration.toFixed(3),
      "-i",
      source,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      file,
    ])
  }
  return files
}

async function encodeHls(source, output, dimensions) {
  const portrait = dimensions.width < dimensions.height
  const sourceLimit = portrait ? dimensions.width : dimensions.height
  const selected = profiles.filter((profile) => profile.height <= sourceLimit)
  if (!selected.length) selected.push(profiles.at(-1))
  for (const profile of selected) {
    const directory = path.join(output, `${profile.height}p`)
    const marker = path.join(directory, ".complete")
    if (await exists(marker)) continue
    await rm(directory, { recursive: true, force: true })
    await mkdir(directory, { recursive: true })
    const targetPrimary = Math.min(profile.height, sourceLimit)
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
      portrait
        ? `scale=${targetPrimary}:-2:flags=lanczos`
        : `scale=-2:${targetPrimary}:flags=lanczos`,
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
      "expr:gte(t,n_forced*2)",
      "-sc_threshold",
      "0",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
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
    await writeFile(marker, "")
  }
  const aspect = dimensions.width / dimensions.height
  const master = ["#EXTM3U", "#EXT-X-VERSION:7"]
  for (const profile of selected) {
    const primary = Math.min(profile.height, sourceLimit)
    const width = portrait ? primary : Math.round((primary * aspect) / 2) * 2
    const height = portrait ? Math.round(primary / aspect / 2) * 2 : primary
    master.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${profile.bandwidth},RESOLUTION=${width}x${height}`,
      `${profile.height}p/index.m3u8`,
    )
  }
  await writeFile(path.join(output, "master.m3u8"), `${master.join("\n")}\n`)
}

async function createProjectDerivatives(source, output, dimensions) {
  const poster = path.join(output, "poster.jpg")
  const previewMp4 = path.join(output, "preview.mp4")
  const previewWebm = path.join(output, "preview.webm")
  const start = Math.max(
    0,
    Math.min(dimensions.duration * 0.18, Math.max(0, dimensions.duration - 7)),
  )
  if (!(await exists(poster)))
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(start),
      "-i",
      source,
      "-frames:v",
      "1",
      "-vf",
      "scale=1920:-2",
      "-q:v",
      "2",
      poster,
    ])
  if (!(await exists(previewMp4)))
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(start),
      "-t",
      "6",
      "-i",
      source,
      "-an",
      "-vf",
      "scale=720:-2",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "24",
      "-movflags",
      "+faststart",
      previewMp4,
    ])
  if (!(await exists(previewWebm)))
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(start),
      "-t",
      "6",
      "-i",
      source,
      "-an",
      "-vf",
      "scale=720:-2",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "34",
      previewWebm,
    ])
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

function contentType(file) {
  if (file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl"
  if (file.endsWith(".m4s")) return "video/iso.segment"
  if (file.endsWith(".jpg")) return "image/jpeg"
  if (file.endsWith(".webm")) return "video/webm"
  if (file.endsWith(".mp4")) return "video/mp4"
  return "application/octet-stream"
}

async function uploadFile(job, file, key) {
  const type = contentType(file)
  const immutable = !file.endsWith(".m3u8")
  const contentLength = (await stat(file)).size
  const signed = await api(`/api/processor/jobs/${job.id}/upload-url`, {
    method: "POST",
    body: JSON.stringify({
      key,
      contentType: type,
      contentLength,
      cacheControl: immutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60",
    }),
  })
  const response = await fetch(signed.url, {
    method: "PUT",
    headers: {
      "content-length": String(contentLength),
      "content-type": type,
    },
    body: createReadStream(file),
    duplex: "half",
  })
  if (!response.ok)
    throw new Error(`R2 output upload failed (${response.status})`)
}

async function uploadOutputs(job, output) {
  const files = await walk(output)
  const concurrency = 4
  for (let offset = 0; offset < files.length; offset += concurrency) {
    await Promise.all(
      files.slice(offset, offset + concurrency).map((file) => {
        const relative = path.relative(output, file).split(path.sep).join("/")
        return uploadFile(job, file, `${job.outputPrefix}/${relative}`)
      }),
    )
    const progress =
      62 +
      Math.round(
        (Math.min(offset + concurrency, files.length) / files.length) * 36,
      )
    await api(`/api/processor/jobs/${job.id}/progress`, {
      method: "POST",
      body: JSON.stringify({ progress }),
    })
  }
}

async function processJob(job) {
  const directory = path.join(WORK_ROOT, job.id)
  const source = path.join(directory, "source")
  const output = path.join(directory, "output")
  await mkdir(output, { recursive: true })
  await download(job, source)
  await api(`/api/processor/jobs/${job.id}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress: 8 }),
  })
  const dimensions = await probe(source)
  const generatedDesktop = job.asset_role === "carouselDesktopFromMaster"
  let carouselClipFiles = []
  if (generatedDesktop) {
    const roughcut = path.join(output, "carousel-roughcut.mp4")
    const segments = await createAutoHighlight(source, roughcut, dimensions)
    carouselClipFiles = await createCarouselClips(
      source,
      path.join(output, "carousel-clips"),
      segments,
    )
    await encodeHls(roughcut, output, await probe(roughcut))
  } else {
    await encodeHls(source, output, dimensions)
  }
  await api(`/api/processor/jobs/${job.id}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress: 52 }),
  })
  if (job.asset_role === "main") {
    await createProjectDerivatives(source, output, dimensions)
    const roughcut = path.join(output, "carousel-roughcut.mp4")
    const segments = await createAutoHighlight(source, roughcut, dimensions)
    carouselClipFiles = await createCarouselClips(
      source,
      path.join(output, "carousel-clips"),
      segments,
    )
    const roughcutDimensions = await probe(roughcut)
    await mkdir(path.join(output, "carousel-desktop"), { recursive: true })
    await encodeHls(
      roughcut,
      path.join(output, "carousel-desktop"),
      roughcutDimensions,
    )
  }
  await api(`/api/processor/jobs/${job.id}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress: 62 }),
  })
  await uploadOutputs(job, output)
  const prefix = job.outputPrefix
  await api(`/api/processor/jobs/${job.id}/complete`, {
    method: "POST",
    body: JSON.stringify({
      output: {
        masterKey: `${prefix}/master.m3u8`,
        posterKey: `${prefix}/poster.jpg`,
        previewMp4Key: `${prefix}/preview.mp4`,
        previewWebmKey: `${prefix}/preview.webm`,
        carouselDesktopMasterKey:
          job.asset_role === "main"
            ? `${prefix}/carousel-desktop/master.m3u8`
            : null,
        carouselRoughcutKey:
          job.asset_role === "main" || generatedDesktop
            ? `${prefix}/carousel-roughcut.mp4`
            : null,
        carouselClipKeys: carouselClipFiles.map(
          (file) => `${prefix}/carousel-clips/${path.basename(file)}`,
        ),
        width: dimensions.width,
        height: dimensions.height,
      },
    }),
  })
  await rm(directory, { recursive: true, force: true })
}

async function tick() {
  const { job } = await api("/api/processor/jobs/next")
  if (!job) return false
  console.log(
    `Processing ${job.original_name} for ${job.project_id} (${job.asset_role})`,
  )
  try {
    await processJob(job)
    console.log(`Completed ${job.id}`)
  } catch (error) {
    console.error(error)
    await api(`/api/processor/jobs/${job.id}/error`, {
      method: "POST",
      body: JSON.stringify({ error: error.message }),
    }).catch(console.error)
  }
  return true
}

await mkdir(WORK_ROOT, { recursive: true })
if (SELF_TEST) {
  const directory = path.join(WORK_ROOT, "self-test")
  const source = path.join(directory, "source.mp4")
  const output = path.join(directory, "output")
  await rm(directory, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=640x360:rate=24",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:sample_rate=48000",
    "-t",
    "18",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    source,
  ])
  const dimensions = await probe(source)
  await encodeHls(source, output, dimensions)
  const remuxedMaster = path.join(directory, "remuxed-master.mp4")
  await download(
    {
      mime_type: "application/vnd.apple.mpegurl",
      downloadUrl: path.join(output, "master.m3u8"),
      size_bytes: 0,
    },
    remuxedMaster,
  )
  const remuxedDimensions = await probe(remuxedMaster)
  if (!remuxedDimensions.width || !remuxedDimensions.height)
    throw new Error(
      "Processor self-test could not ingest an existing HLS master",
    )
  await createProjectDerivatives(source, output, dimensions)
  const roughcut = path.join(output, "carousel-roughcut.mp4")
  const segments = await createAutoHighlight(source, roughcut, dimensions)
  await createCarouselClips(
    source,
    path.join(output, "carousel-clips"),
    segments,
  )
  await mkdir(path.join(output, "carousel-desktop"), { recursive: true })
  await encodeHls(
    roughcut,
    path.join(output, "carousel-desktop"),
    await probe(roughcut),
  )
  for (const required of [
    "master.m3u8",
    "poster.jpg",
    "preview.mp4",
    "preview.webm",
    "carousel-roughcut.mp4",
    "carousel-clips/clip-01.mp4",
    "carousel-clips/clip-05.mp4",
    "carousel-desktop/master.m3u8",
  ]) {
    if (!(await exists(path.join(output, required))))
      throw new Error(`Processor self-test did not create ${required}`)
  }
  await rm(directory, { recursive: true, force: true })
  console.log("TAGG CMS media processor self-test passed.")
} else {
  do {
    const worked = await tick().catch((error) => {
      console.error(error)
      return false
    })
    if (ONCE) break
    if (!worked) await sleep(POLL_MS)
  } while (true)
}
