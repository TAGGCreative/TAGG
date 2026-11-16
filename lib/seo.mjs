export const SITE_URL = "https://www.taggcreative.com"
export const SITE_NAME = "TAGG Creative"
export const SITE_DESCRIPTION =
  "TAGG Creative is a Vancouver production studio creating bold films, branded content, and post-production work."

export function absoluteUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const url = new URL(value, `${SITE_URL}/`)
    return ["https:", "http:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export function canonicalUrl(path = "/") {
  const pathname = String(path).split(/[?#]/, 1)[0]
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

export function projectMetadata(project) {
  const client = project.client || "Unknown Client"
  const title = project.title || "Untitled"
  return {
    title: `${client} — ${title} | ${SITE_NAME}`,
    description: `${title}, created for ${client} by ${SITE_NAME}.`,
    path: `/works/${encodeURIComponent(project.id)}`,
    image: project.poster?.src,
    imageAlt: `${client} — ${title}`,
  }
}

// Escape CMS text before embedding JSON-LD in an HTML script element.
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function organizationData(editorial) {
  const contact = editorial?.contact || {}
  const organizationId = `${SITE_URL}/#organization`
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/images/taggSpray.png`,
        description: SITE_DESCRIPTION,
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.addressLines?.length
          ? { address: contact.addressLines.join(", ") }
          : {}),
        sameAs: Object.values(contact.socials || {})
          .filter((url) => /^https?:\/\//i.test(url))
          .map(absoluteUrl)
          .filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        publisher: { "@id": organizationId },
        inLanguage: "en",
      },
    ],
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function videoLocation(source, customerCode) {
  if (source?.provider === "hls") {
    const url = absoluteUrl(source.url)
    return url ? { tag: "content_loc", url } : null
  }
  if (source?.provider === "vimeo" && /^\d+$/.test(source.id)) {
    return {
      tag: "player_loc",
      url: `https://player.vimeo.com/video/${source.id}`,
    }
  }
  if (
    source?.provider === "cloudflare" &&
    source.id &&
    /^[a-z0-9-]+$/i.test(customerCode || "")
  ) {
    return {
      tag: "player_loc",
      url: `https://customer-${customerCode}.cloudflarestream.com/${encodeURIComponent(source.id)}/iframe`,
    }
  }
  return null
}

export function buildSitemap(content, { preview = false } = {}) {
  const entries = preview
    ? []
    : ["/", "/privacy-policy"].map(
        (path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`,
      )
  const seen = new Set()
  for (const project of preview ? [] : content.media.works) {
    if (project.visible === false || !project.id || seen.has(project.id))
      continue
    seen.add(project.id)
    const metadata = projectMetadata(project)
    const thumbnail = absoluteUrl(metadata.image)
    const location = videoLocation(
      project.source,
      content.media.cloudflare?.customerCode,
    )
    const video =
      thumbnail && location
        ? `
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(`${project.client} — ${project.title}`.slice(0, 100))}</video:title>
      <video:description>${escapeXml(metadata.description.slice(0, 2048))}</video:description>
      <video:${location.tag}>${escapeXml(location.url)}</video:${location.tag}>
    </video:video>`
        : ""
    entries.push(
      `  <url>\n    <loc>${escapeXml(canonicalUrl(metadata.path))}</loc>${video}\n  </url>`,
    )
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries.join("\n")}
</urlset>\n`
}

export function buildRobotsTxt({ preview = false } = {}) {
  if (preview) return "User-agent: *\nDisallow: /\n"
  // The wildcard also permits OAI-SearchBot, Claude-SearchBot and PerplexityBot.
  // Keep page assets crawlable; noindex tags handle the lab and CMS previews.
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`
}
