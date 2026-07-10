import "dotenv/config"

import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const CATALOG_PATH = path.join(ROOT, "content", "media-catalog.json")
const DRY_RUN = process.argv.includes("--dry-run")
const CHECK_SOURCE = process.argv.includes("--check-source")
const limitArgument = process.argv.find((argument) =>
  argument.startsWith("--limit="),
)
const LIMIT = limitArgument ? Number(limitArgument.split("=")[1]) : Infinity

const requiredEnvironment = DRY_RUN
  ? CHECK_SOURCE
    ? ["ACCESS_TOKEN"]
    : []
  : [
      "ACCESS_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_STREAM_CUSTOMER_CODE",
    ]
const missingEnvironment = requiredEnvironment.filter(
  (key) => !process.env[key],
)

if (missingEnvironment.length) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironment.join(", ")}`,
  )
}

const allowedOrigins = (
  process.env.CLOUDFLARE_ALLOWED_ORIGINS ||
  "taggcreative.com,www.taggcreative.com"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => null)

  if (!response.ok || body?.success === false) {
    const message =
      body?.error || body?.errors?.[0]?.message || response.statusText
    throw new Error(`Request failed (${response.status}): ${message}`)
  }

  return body
}

async function getVimeoDownload(vimeoId) {
  const fields = encodeURIComponent("uri,name,download,files,play")
  const response = await apiRequest(
    `https://api.vimeo.com/videos/${vimeoId}?fields=${fields}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    },
  )

  const downloads = [
    ...(response.download || []),
    ...(response.files || []),
    ...(response.play?.progressive || []),
  ].filter((download) => download.link)
  const selected =
    downloads.find((download) => download.quality === "source") ||
    downloads.sort((a, b) => (b.size || 0) - (a.size || 0))[0]

  if (!selected) {
    throw new Error(
      `Vimeo did not provide a downloadable file for ${vimeoId}. The token needs public, private, and video_files scopes.`,
    )
  }

  return { name: response.name || vimeoId, url: selected.link }
}

async function copyToCloudflare({ vimeoId, name, url, collection }) {
  const response = await apiRequest(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        allowedOrigins,
        requireSignedURLs: false,
        meta: {
          name,
          legacyVimeoId: vimeoId,
          collection,
        },
      }),
    },
  )

  if (!response.result?.uid) {
    throw new Error(
      `Cloudflare did not return a video UID for Vimeo ${vimeoId}`,
    )
  }

  return response.result.uid
}

function allCatalogEntries(catalog) {
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

function replaceSource(catalog, vimeoId, cloudflareId) {
  allCatalogEntries(catalog).forEach(({ entry }) => {
    if (entry.source?.provider === "vimeo" && entry.source.id === vimeoId) {
      entry.source = {
        provider: "cloudflare",
        id: cloudflareId,
        legacyVimeoId: vimeoId,
      }
    }
  })
}

async function saveCatalog(catalog) {
  catalog.cloudflare = {
    customerCode: process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE,
    allowedOrigins,
  }
  catalog.generatedAt = new Date().toISOString()
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"))
  const pending = []
  const seen = new Set()

  allCatalogEntries(catalog).forEach(({ entry, collection }) => {
    if (entry.source?.provider !== "vimeo" || seen.has(entry.source.id)) return
    seen.add(entry.source.id)
    pending.push({
      vimeoId: entry.source.id,
      name: `${entry.client} — ${entry.title}`,
      collection,
    })
  })

  const selected = pending.slice(0, LIMIT)
  console.log(
    `${DRY_RUN ? "Would migrate" : "Migrating"} ${selected.length} of ${pending.length} Vimeo videos to Cloudflare Stream.`,
  )

  for (const [index, item] of selected.entries()) {
    console.log(
      `[${index + 1}/${selected.length}] ${item.name} (${item.vimeoId})`,
    )
    if (DRY_RUN) {
      if (CHECK_SOURCE) {
        await getVimeoDownload(item.vimeoId)
        console.log("  Vimeo source download is available.")
      }
      continue
    }

    const download = await getVimeoDownload(item.vimeoId)
    const cloudflareId = await copyToCloudflare({
      ...item,
      name: download.name || item.name,
      url: download.url,
    })

    replaceSource(catalog, item.vimeoId, cloudflareId)
    await saveCatalog(catalog)
  }

  if (!DRY_RUN) {
    await saveCatalog(catalog)
    console.log(`Migration catalog saved to ${CATALOG_PATH}`)
  }
}

await main()
