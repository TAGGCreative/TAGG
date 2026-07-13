import mediaCatalog from "../content/media-catalog.json"
import editorial from "../content/editorial-content.json"

export function getFallbackSiteContent() {
  return {
    version: 1,
    updatedAt: mediaCatalog.generatedAt,
    media: mediaCatalog,
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

function contentUrl(previewToken) {
  const configured = process.env.CMS_CONTENT_BASE_URL?.replace(/\/$/, "")
  const base =
    configured ||
    (process.env.VERCEL_ENV === "preview"
      ? "https://media.taggcreative.com/cms-preview"
      : null)
  if (!base) return null
  return previewToken
    ? `${base}/previews/${encodeURIComponent(previewToken)}.json`
    : process.env.CMS_PUBLISHED_CONTENT_URL || `${base}/published/current.json`
}

export async function getSiteContent({ previewToken } = {}) {
  const url = contentUrl(previewToken)
  if (!url) return getFallbackSiteContent()

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok)
      throw new Error(`Content request failed (${response.status})`)
    const content = await response.json()
    return isSiteContent(content) ? content : getFallbackSiteContent()
  } catch (error) {
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
