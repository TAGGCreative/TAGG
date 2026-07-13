import "dotenv/config"

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
import { availableParallelism } from "node:os"
import path from "node:path"
import { Transform } from "node:stream"
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

function createProgressReporter(job) {
  let lastProgress = -1
  let lastSentAt = 0
  let pending = Promise.resolve()
  const report = (value, force = false) => {
    const progress = Math.max(0, Math.min(98, Math.floor(Number(value) || 0)))
    const currentTime = Date.now()
    if (
      progress <= lastProgress ||
      (!force && currentTime - lastSentAt < 1500 && progress - lastProgress < 2)
    )
      return pending
    lastProgress = progress
    lastSentAt = currentTime
    pending = pending
      .catch(() => {})
      .then(() =>
        api(`/api/processor/jobs/${job.id}/progress`, {
          method: "POST",
          body: JSON.stringify({ progress }),
        }),
      )
    return pending
  }
  return { report, flush: () => pending }
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

function runFfmpeg(args, duration, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "ffmpeg",
      ["-progress", "pipe:2", "-nostats", ...args],
      { stdio: ["ignore", "ignore", "pipe"] },
    )
    let errorOutput = ""
    let lineBuffer = ""
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      errorOutput += text
      if (errorOutput.length > 8000) errorOutput = errorOutput.slice(-8000)
      lineBuffer += text
      const lines = lineBuffer.split(/\r?\n/)
      lineBuffer = lines.pop() || ""
      for (const line of lines) {
        const match = line.match(/^out_time_us=(\d+)$/)
        if (match && duration > 0)
          onProgress(Math.min(0.995, Number(match[1]) / 1_000_000 / duration))
      }
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        onProgress(1)
        resolve()
      } else reject(new Error(`ffmpeg failed: ${errorOutput.trim()}`))
    })
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

async function download(job, target, onProgress = () => {}) {
  const isHls =
    job.mime_type === "application/vnd.apple.mpegurl" ||
    String(job.downloadUrl).includes(".m3u8")
  if (isHls) {
    if ((await exists(target)) && (await stat(target)).size > 0) {
      onProgress(1)
      return
    }
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
    onProgress(1)
    return
  }
  if (
    (await exists(target)) &&
    (await stat(target)).size === Number(job.size_bytes)
  )
    return onProgress(1)
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
  const total =
    Number(job.size_bytes || 0) ||
    Number(response.headers.get("content-length"))
  let received = 0
  const meter = new Transform({
    transform(chunk, encoding, callback) {
      received += chunk.length
      if (total > 0) onProgress(Math.min(1, received / total))
      callback(null, chunk)
    },
  })
  await pipeline(
    response.body,
    meter,
    (await import("node:fs")).createWriteStream(partial),
  )
  await (await import("node:fs/promises")).rename(partial, target)
  onProgress(1)
}

async function probe(source) {
  const output = await capture("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,codec_name,width,height:format=duration",
    "-of",
    "json",
    source,
  ])
  const data = JSON.parse(output)
  const video = data.streams.find((stream) => stream.codec_type === "video")
  const audio = data.streams.find((stream) => stream.codec_type === "audio")
  return {
    ...video,
    audioCodec: audio?.codec_name || null,
    duration: Number(data.format.duration || 0),
  }
}

function percentile(values, ratio) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[
    Math.max(
      0,
      Math.min(sorted.length - 1, Math.round((sorted.length - 1) * ratio)),
    )
  ]
}

async function analyzeVisualTimeline(source, sampleFps = 6) {
  return new Promise((resolve) => {
    const child = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "info",
        "-i",
        source,
        "-an",
        "-vf",
        `fps=${sampleFps},scale=320:-2:flags=fast_bilinear,signalstats,metadata=print:key=lavfi.signalstats.YDIF,metadata=print:key=lavfi.signalstats.SATAVG,scdet=threshold=0,metadata=print:key=lavfi.scd.score,entropy,metadata=print:key=lavfi.entropy.normalized_entropy.normal.Y`,
        "-f",
        "null",
        "-",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    )
    let output = ""
    child.stderr.on("data", (chunk) => {
      output += chunk
      if (output.length > 8_000_000) output = output.slice(-8_000_000)
    })
    child.on("error", () => resolve([]))
    child.on("exit", () => {
      const samples = new Map()
      let currentTime = null
      for (const line of output.split("\n")) {
        const timeMatch = line.match(/frame:\d+.*pts_time:([0-9.]+)/)
        if (timeMatch) currentTime = Number(timeMatch[1])
        if (!Number.isFinite(currentTime)) continue
        const key = currentTime.toFixed(3)
        const sample = samples.get(key) || {
          time: currentTime,
          motion: 0,
          saturation: 0,
          detail: 0,
          cutScore: 0,
        }
        const motionMatch = line.match(/lavfi\.signalstats\.YDIF=([0-9.]+)/)
        if (motionMatch) sample.motion = Number(motionMatch[1])
        const saturationMatch = line.match(
          /lavfi\.signalstats\.SATAVG=([0-9.]+)/,
        )
        if (saturationMatch) sample.saturation = Number(saturationMatch[1])
        const cutMatch = line.match(/lavfi\.scd\.score=([0-9.]+)/)
        if (cutMatch) sample.cutScore = Number(cutMatch[1])
        const detailMatch = line.match(
          /lavfi\.entropy\.normalized_entropy\.normal\.Y=([0-9.]+)/,
        )
        if (detailMatch) sample.detail = Number(detailMatch[1])
        samples.set(key, sample)
      }
      resolve([...samples.values()].sort((a, b) => a.time - b.time))
    })
  })
}

async function analyzeTextTimeline(source, sampleFps = 1) {
  return new Promise((resolve) => {
    const child = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "info",
        "-i",
        source,
        "-an",
        "-vf",
        `fps=${sampleFps},scale=480:-2:flags=fast_bilinear,ocr,metadata=print:key=lavfi.ocr.text`,
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
    child.on("error", () => resolve([]))
    child.on("exit", () => {
      const samples = []
      let currentTime = null
      for (const line of output.split("\n")) {
        const timeMatch = line.match(/frame:\d+.*pts_time:([0-9.]+)/)
        if (timeMatch) currentTime = Number(timeMatch[1])
        const textMatch = line.match(/lavfi\.ocr\.text=(.*)$/)
        if (!textMatch || !Number.isFinite(currentTime)) continue
        const words = textMatch[1].match(/[A-Za-z]{4,}/g) || []
        samples.push({
          time: currentTime,
          textScore: words.reduce((sum, word) => sum + word.length, 0),
        })
      }
      resolve(samples)
    })
  })
}

async function detectSceneTimes(source, duration, timeline = []) {
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
        duration > 300
          ? "fps=8,scale=480:-2:flags=fast_bilinear,select='gt(scene,0.13)',showinfo"
          : "select='gt(scene,0.16)',showinfo",
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
          value > 0.25 &&
          value < duration - 0.35 &&
          value - times.at(-1) > 0.24
        )
          times.push(value)
      }
      for (let index = 1; index < timeline.length - 1; index += 1) {
        const sample = timeline[index]
        if (
          sample.cutScore >= 3.2 &&
          sample.cutScore >= timeline[index - 1].cutScore * 1.35 &&
          sample.cutScore >= timeline[index + 1].cutScore * 1.35 &&
          sample.time > 0.25 &&
          sample.time < duration - 0.35
        )
          times.push(sample.time)
      }
      const merged = [...new Set(times.map((time) => Number(time.toFixed(3))))]
        .sort((a, b) => a - b)
        .filter(
          (time, index, values) =>
            index === 0 || time - values[index - 1] > 0.22,
        )
      resolve(merged)
    })
  })
}

function chooseHighlightSegments(
  sceneTimes,
  duration,
  timeline = [],
  textTimeline = [],
) {
  if (duration <= 15) return [{ start: 0, duration }]
  const desired = Math.min(9, Math.max(5, Math.floor(duration / 7)))
  const boundaries = [
    0,
    ...sceneTimes.filter((time) => time > 0.01 && time < duration - 0.01),
    duration,
  ]
    .sort((a, b) => a - b)
    .filter(
      (time, index, values) => index === 0 || time - values[index - 1] > 0.22,
    )
  const motionValues = timeline
    .map((sample) => sample.motion)
    .filter(Number.isFinite)
  const motionFloor = percentile(motionValues, 0.25)
  const motionPeak = Math.max(motionFloor + 0.01, percentile(motionValues, 0.9))
  const saturationValues = timeline
    .map((sample) => sample.saturation)
    .filter(Number.isFinite)
  const saturationFloor = percentile(saturationValues, 0.2)
  const saturationPeak = Math.max(
    saturationFloor + 0.01,
    percentile(saturationValues, 0.85),
  )
  const detailValues = timeline
    .map((sample) => sample.detail)
    .filter(Number.isFinite)
  const detailFloor = percentile(detailValues, 0.2)
  const detailPeak = Math.max(
    detailFloor + 0.001,
    percentile(detailValues, 0.85),
  )
  const candidates = []

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const shotStart = boundaries[index]
    const shotEnd = boundaries[index + 1]
    const shotDuration = shotEnd - shotStart
    const clipDuration = Math.min(1.4, shotDuration - 0.2)
    if (clipDuration < 0.72) continue
    const earliest = shotStart + 0.1
    const latest = Math.max(earliest, shotEnd - 0.1 - clipDuration)
    const positionCount = Math.min(
      5,
      Math.max(1, Math.floor(shotDuration / 2.4)),
    )
    for (let position = 0; position < positionCount; position += 1) {
      const ratio = (position + 1) / (positionCount + 1)
      const start = earliest + (latest - earliest) * ratio
      const end = start + clipDuration
      const windowSamples = timeline.filter(
        (sample) => sample.time >= start + 0.08 && sample.time <= end - 0.08,
      )
      const windowValues = windowSamples.map((sample) => sample.motion)
      const average = windowValues.length
        ? windowValues.reduce((sum, value) => sum + value, 0) /
          windowValues.length
        : motionFloor
      const active = windowValues.length
        ? percentile(windowValues, 0.78)
        : motionFloor
      const rawEnergy = average * 0.42 + active * 0.58
      const normalizedEnergy = Math.max(
        0,
        Math.min(1.5, (rawEnergy - motionFloor) / (motionPeak - motionFloor)),
      )
      const saturation = windowSamples.length
        ? windowSamples.reduce((sum, sample) => sum + sample.saturation, 0) /
          windowSamples.length
        : saturationFloor
      const normalizedSaturation = Math.max(
        0,
        Math.min(
          1.2,
          (saturation - saturationFloor) / (saturationPeak - saturationFloor),
        ),
      )
      const detail = windowSamples.length
        ? windowSamples.reduce((sum, sample) => sum + sample.detail, 0) /
          windowSamples.length
        : detailFloor
      const normalizedDetail = Math.max(
        0,
        Math.min(1.2, (detail - detailFloor) / (detailPeak - detailFloor)),
      )
      const titleCardWeight =
        normalizedSaturation < 0.18 && normalizedDetail < 0.22 ? 0.55 : 1
      const textScore = textTimeline
        .filter(
          (sample) => sample.time >= start - 0.35 && sample.time <= end + 0.35,
        )
        .reduce((highest, sample) => Math.max(highest, sample.textScore), 0)
      const textWeight = textScore >= 8 ? 0.24 : textScore >= 5 ? 0.62 : 1
      const midpoint = start + clipDuration / 2
      const edgeWeight =
        midpoint < duration * 0.04 || midpoint > duration * 0.96 ? 0.68 : 1
      const shotWeight = shotDuration > 10 ? 0.9 : 1
      candidates.push({
        start,
        duration: clipDuration,
        midpoint,
        score:
          (0.12 +
            normalizedEnergy * 0.58 +
            normalizedSaturation * 0.18 +
            normalizedDetail * 0.24) *
          edgeWeight *
          shotWeight *
          titleCardWeight *
          textWeight,
      })
    }
  }

  const ranked = [...candidates].sort(
    (a, b) => b.score - a.score || a.start - b.start,
  )
  const selected = []
  const bucketCount = Math.min(5, desired)
  const bucketLimit = Math.ceil(desired / bucketCount)
  const bucketCounts = Array.from({ length: bucketCount }, () => 0)
  const minimumGap = Math.max(2.1, duration / (desired * 2.5))

  const tryAdd = (candidate, gap, enforceBuckets) => {
    if (
      selected.some(
        (existing) => Math.abs(existing.midpoint - candidate.midpoint) < gap,
      )
    )
      return false
    const bucket = Math.min(
      bucketCount - 1,
      Math.floor((candidate.midpoint / duration) * bucketCount),
    )
    if (enforceBuckets && bucketCounts[bucket] >= bucketLimit) return false
    selected.push(candidate)
    bucketCounts[bucket] += 1
    return true
  }

  for (const candidate of ranked) {
    tryAdd(candidate, minimumGap, true)
    if (selected.length >= desired) break
  }
  for (const candidate of ranked) {
    if (selected.includes(candidate)) continue
    tryAdd(candidate, minimumGap * 0.62, false)
    if (selected.length >= desired) break
  }
  for (const candidate of ranked) {
    if (!selected.includes(candidate)) selected.push(candidate)
    if (selected.length >= desired) break
  }

  return selected
    .slice(0, desired)
    .sort((a, b) => a.start - b.start)
    .map(({ start, duration: clipDuration }) => ({
      start: Number(start.toFixed(3)),
      duration: Number(clipDuration.toFixed(3)),
    }))
}

async function createAutoHighlight(
  source,
  target,
  dimensions,
  onProgress = async () => {},
) {
  const selectionFile = path.join(
    path.dirname(path.dirname(target)),
    "carousel-segments.json",
  )
  if (await exists(selectionFile))
    return JSON.parse(await readFile(selectionFile, "utf8"))
  const longVideo = dimensions.duration > 300
  const [timeline, textTimeline] = await Promise.all([
    analyzeVisualTimeline(source, longVideo ? 2 : 6),
    analyzeTextTimeline(source, longVideo ? 0.25 : 1),
  ])
  await onProgress(14)
  const scenes = await detectSceneTimes(source, dimensions.duration, timeline)
  await onProgress(20)
  const segments = chooseHighlightSegments(
    scenes,
    dimensions.duration,
    timeline,
    textTimeline,
  )
  await writeFile(selectionFile, JSON.stringify(segments, null, 2))
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
  await onProgress(30)
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

async function encodeHls(
  source,
  output,
  dimensions,
  onProgress = () => {},
  createScrubProxy = false,
) {
  const portrait = dimensions.width < dimensions.height
  const sourceLimit = portrait ? dimensions.width : dimensions.height
  const available = profiles.filter((profile) => profile.height <= sourceLimit)
  let selected = available.length ? [available[0]] : [profiles.at(-1)]
  const lightweight = available.find((profile) => profile.height <= 540)
  if (lightweight && lightweight.height !== selected[0].height)
    selected.push(lightweight)
  const selectedDirectories = new Set(
    selected.map((profile) => `${profile.height}p`),
  )
  await Promise.all(
    profiles
      .map((profile) => `${profile.height}p`)
      .filter((directory) => !selectedDirectories.has(directory))
      .map((directory) =>
        rm(path.join(output, directory), { recursive: true, force: true }),
      ),
  )
  const canRemuxSource =
    dimensions.codec_name === "h264" && selected[0].height === sourceLimit
  const profileProgress = selected.map(() => 0)
  let emittedProgress = 0
  const updateProfileProgress = (index, value) => {
    profileProgress[index] = Math.max(
      profileProgress[index],
      Math.min(1, value),
    )
    const overall =
      profileProgress.reduce((total, item) => total + item, 0) /
      profileProgress.length
    if (overall > emittedProgress) {
      emittedProgress = overall
      onProgress(overall)
    }
  }

  await Promise.all(
    selected.map(async (profile, index) => {
      const directory = path.join(output, `${profile.height}p`)
      const marker = path.join(directory, ".complete")
      if (await exists(marker)) {
        updateProfileProgress(index, 1)
        return
      }
      await rm(directory, { recursive: true, force: true })
      await mkdir(directory, { recursive: true })
      const targetPrimary = Math.min(profile.height, sourceLimit)
      const remux = canRemuxSource && index === 0
      const scrubProxy = createScrubProxy && index === selected.length - 1
      const scrubFile = path.join(output, "scrub.mp4")
      const videoOptions = remux
        ? ["-c:v", "copy"]
        : [
            "-vf",
            portrait
              ? `scale=${targetPrimary}:-2:flags=lanczos`
              : `scale=-2:${targetPrimary}:flags=lanczos`,
            "-c:v",
            "h264_videotoolbox",
            "-allow_sw",
            "1",
            "-prio_speed",
            "1",
            "-profile:v",
            "high",
            "-coder",
            "cabac",
            "-b:v",
            profile.bitrate,
            "-maxrate",
            profile.bitrate,
            "-bufsize",
            profile.buffer,
            "-pix_fmt",
            "nv12",
            "-force_key_frames",
            "expr:gte(t,n_forced*6)",
            "-sc_threshold",
            "0",
          ]
      const inputForHls = scrubProxy ? scrubFile : source
      let hlsProgressStart = 0
      if (scrubProxy && !remux)
        await runFfmpeg(
          [
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
            ...videoOptions,
            "-c:a",
            dimensions.audioCodec === "aac" ? "copy" : "aac",
            ...(dimensions.audioCodec === "aac" ? [] : ["-b:a", "128k"]),
            "-movflags",
            "+faststart",
            scrubFile,
          ],
          dimensions.duration,
          (fraction) => updateProfileProgress(index, fraction * 0.9),
        )
      else if (scrubProxy && remux)
        await runFfmpeg(
          [
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
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            scrubFile,
          ],
          dimensions.duration,
          (fraction) => updateProfileProgress(index, fraction * 0.35),
        )
      if (scrubProxy) hlsProgressStart = remux ? 0.35 : 0.9
      await runFfmpeg(
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          "-i",
          inputForHls,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0?",
          ...(scrubProxy ? ["-c", "copy"] : videoOptions),
          ...(scrubProxy
            ? []
            : [
                "-c:a",
                dimensions.audioCodec === "aac" ? "copy" : "aac",
                ...(dimensions.audioCodec === "aac" ? [] : ["-b:a", "128k"]),
              ]),
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
          path.join(directory, "index.m3u8"),
        ],
        dimensions.duration,
        (fraction) =>
          updateProfileProgress(
            index,
            hlsProgressStart + fraction * (1 - hlsProgressStart),
          ),
      )
      await writeFile(marker, "")
      updateProfileProgress(index, 1)
    }),
  )
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

async function createSelectedDerivatives(source, output, dimensions, options) {
  const poster = path.join(output, "poster.jpg")
  const previewMp4 = path.join(output, "preview.mp4")
  const posterTime = Math.max(
    0,
    Math.min(Number(options.posterTime || 0), dimensions.duration),
  )
  const previewStart = Math.max(
    0,
    Math.min(
      Number(options.previewStart || 0),
      Math.max(0, dimensions.duration - 1),
    ),
  )
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(posterTime),
    "-i",
    source,
    "-frames:v",
    "1",
    "-q:v",
    "1",
    poster,
  ])
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(previewStart),
    "-t",
    "6",
    "-i",
    source,
    "-an",
    "-vf",
    dimensions.width < dimensions.height
      ? "scale=-2:960:flags=lanczos"
      : "scale=960:-2:flags=lanczos",
    "-c:v",
    "h264_videotoolbox",
    "-allow_sw",
    "1",
    "-prio_speed",
    "1",
    "-b:v",
    "3500k",
    "-pix_fmt",
    "nv12",
    "-movflags",
    "+faststart",
    previewMp4,
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

async function uploadOutputs(job, output, progressStart = 70, onProgress) {
  const files = await walk(output)
  const concurrency = Math.min(12, Math.max(4, availableParallelism()))
  for (let offset = 0; offset < files.length; offset += concurrency) {
    await Promise.all(
      files.slice(offset, offset + concurrency).map((file) => {
        const relative = path.relative(output, file).split(path.sep).join("/")
        return uploadFile(job, file, `${job.outputPrefix}/${relative}`)
      }),
    )
    const progress =
      progressStart +
      Math.round(
        (Math.min(offset + concurrency, files.length) / files.length) *
          (98 - progressStart),
      )
    await onProgress(progress, true)
  }
}

async function processJob(job) {
  const directory = path.join(WORK_ROOT, job.id)
  const localSource = path.join(directory, "source")
  const output = path.join(directory, "output")
  const selectedDerivatives = job.asset_role === "projectDerivatives"
  const source = selectedDerivatives ? job.downloadUrl : localSource
  const progress = createProgressReporter(job)
  await mkdir(output, { recursive: true })
  if (!selectedDerivatives)
    await download(job, localSource, (fraction) =>
      progress.report(1 + fraction * 7),
    )
  await progress.report(8, true)
  const dimensions = await probe(source)
  if (selectedDerivatives) {
    await createSelectedDerivatives(
      source,
      output,
      dimensions,
      job.options || {},
    )
    await progress.report(70, true)
    await uploadOutputs(job, output, 70, progress.report)
  } else {
    await encodeHls(
      source,
      output,
      dimensions,
      (fraction) => progress.report(8 + fraction * 62),
      job.asset_role === "main",
    )
    await progress.report(70, true)
    await uploadOutputs(job, output, 70, progress.report)
  }
  await progress.flush()
  const prefix = job.outputPrefix
  await api(`/api/processor/jobs/${job.id}/complete`, {
    method: "POST",
    body: JSON.stringify({
      output: {
        masterKey: selectedDerivatives ? null : `${prefix}/master.m3u8`,
        scrubKey: job.asset_role === "main" ? `${prefix}/scrub.mp4` : null,
        posterKey: selectedDerivatives ? `${prefix}/poster.jpg` : null,
        previewMp4Key: selectedDerivatives ? `${prefix}/preview.mp4` : null,
        posterTime: selectedDerivatives
          ? Number(job.options?.posterTime || 0)
          : null,
        previewStart: selectedDerivatives
          ? Number(job.options?.previewStart || 0)
          : null,
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
  await encodeHls(source, output, dimensions, async () => {}, true)
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
  await createSelectedDerivatives(source, output, dimensions, {
    posterTime: 4,
    previewStart: 8,
  })
  for (const required of [
    "master.m3u8",
    "scrub.mp4",
    "poster.jpg",
    "preview.mp4",
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
