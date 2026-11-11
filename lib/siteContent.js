import mediaCatalog from "../content/media-catalog.json"
import editorial from "../content/editorial-content.json"

const mediaPrefix = "https://media.taggcreative.com/videos/"

function withPreviewPlayback(catalog) {
  if (process.env.VERCEL_ENV !== "preview") return catalog
  const usePreviewRoute = (entry) => {
    const source = entry.source
    if (source?.provider !== "hls" || !source.url?.startsWith(mediaPrefix))
      return entry
    return {
      ...entry,
      source: {
        ...source,
        url: `/preview-video/${source.url.slice(mediaPrefix.length)}`,
      },
    }
  }
  return {
    ...catalog,
    works: catalog.works.map(usePreviewRoute),
    carousels: {
      desktop: catalog.carousels.desktop.map(usePreviewRoute),
      mobile: catalog.carousels.mobile.map(usePreviewRoute),
    },
  }
}

export function getFallbackSiteContent() {
  return {
    version: 1,
    updatedAt: mediaCatalog.generatedAt,
    media: withPreviewPlayback(mediaCatalog),
    editorial,
  }
}

function isSiteContent(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray(value.media?.works) &&
      value.editorial?.sections &&
      value.editorial?.people &&
      value.editorial?.contact,
  )
}

function contentUrl() {
  if (process.env.TAGG_CMS_ENABLED !== "true") return null
  const base = process.env.CMS_CONTENT_BASE_URL?.replace(/\/$/, "")
  return (
    process.env.CMS_PUBLISHED_CONTENT_URL ||
    (base ? `${base}/published/current.json` : null)
  )
}

function cmsAccessHeaders() {
  const clientId = process.env.CMS_ACCESS_CLIENT_ID
  const clientSecret = process.env.CMS_ACCESS_CLIENT_SECRET
  return clientId && clientSecret
    ? {
        "CF-Access-Client-Id": clientId,
        "CF-Access-Client-Secret": clientSecret,
      }
    : {}
}

export async function getSiteContent({ previewToken } = {}) {
  const previewOrigin = process.env.CMS_PREVIEW_SOURCE_URL?.replace(/\/$/, "")
  const previewSecret = process.env.CMS_PREVIEW_SECRET
  if (
    previewToken &&
    process.env.TAGG_CMS_ENABLED === "true" &&
    previewOrigin &&
    previewSecret
  ) {
    try {
      const response = await fetch(
        `${previewOrigin}/api/private-preview/${encodeURIComponent(previewToken)}`,
        {
          headers: {
            ...cmsAccessHeaders(),
            Authorization: `Bearer ${previewSecret}`,
          },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        },
      )
      if (response.ok) {
        const content = await response.json()
        if (isSiteContent(content)) return content
      }
    } catch (error) {
      console.warn("CMS preview unavailable; using published content.", error)
    }
  }
  const url = contentUrl()
  if (!url) return getFallbackSiteContent()

  try {
    const response = await fetch(url, {
      headers: {
        ...(previewOrigin &&
        new URL(url).origin === new URL(previewOrigin).origin
          ? cmsAccessHeaders()
          : {}),
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok)
      throw new Error(`Content request failed (${response.status})`)
    const content = await response.json()
    if (!isSiteContent(content))
      throw new Error("Published content is invalid.")
    return content
  } catch (error) {
    if (process.env.CMS_PUBLISHED_CONTENT_URL) throw error
    console.warn("CMS content unavailable; using bundled fallback.", error)
    return getFallbackSiteContent()
  }
}

export async function getPublishedWork(videoId, options) {
  const content = await getSiteContent(options)
  return {
    content,
    work:
      content.media.works.find((item) => item.id === String(videoId)) || null,
  }
}
