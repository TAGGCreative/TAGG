import assert from "node:assert/strict"
import test from "node:test"
import {
  absoluteUrl,
  buildRobotsTxt,
  buildSitemap,
  canonicalUrl,
  organizationData,
  serializeJsonLd,
  SITE_URL,
} from "../lib/seo.mjs"

const project = {
  id: "client-film",
  client: "Client & Partner",
  title: 'A <Story> "Worth" Telling',
  poster: { src: "/media/posters/film.jpg" },
  source: {
    provider: "hls",
    url: "https://media.taggcreative.com/film/master.m3u8?a=1&b=2",
  },
}

test("sitemaps exclude hidden work and encode CMS text without breaking XML", () => {
  const sitemap = buildSitemap({
    media: {
      works: [
        project,
        project,
        { ...project, id: "hidden-project", visible: false },
        { ...project, id: "special/id?", poster: null },
      ],
    },
  })
  assert.equal((sitemap.match(/<url>/g) || []).length, 4)
  assert.equal((sitemap.match(/<video:video>/g) || []).length, 1)
  assert.ok(!sitemap.includes("hidden-project"))
  assert.ok(!sitemap.includes("/modal-lab"))
  assert.ok(sitemap.includes("/works/special%2Fid%3F"))
  assert.ok(sitemap.includes("Client &amp; Partner"))
  assert.ok(sitemap.includes("&lt;Story&gt; &quot;Worth&quot;"))
  assert.ok(sitemap.includes("?a=1&amp;b=2"))
  // Catalog generation and modification times are not video publication dates.
  assert.ok(!sitemap.includes("publication_date"))
  assert.ok(!sitemap.includes("lastmod"))
})

test("video sitemaps use player URLs for embeds and skip invalid media", () => {
  const sitemap = buildSitemap({
    media: {
      cloudflare: { customerCode: "test123" },
      works: [
        { ...project, id: "vimeo", source: { provider: "vimeo", id: "123" } },
        {
          ...project,
          id: "stream",
          source: { provider: "cloudflare", id: "stream123" },
        },
        {
          ...project,
          id: "invalid",
          source: { provider: "hls", url: "javascript:alert(1)" },
        },
      ],
    },
  })
  assert.equal((sitemap.match(/<video:video>/g) || []).length, 2)
  assert.ok(sitemap.includes("https://player.vimeo.com/video/123"))
  assert.ok(
    sitemap.includes(
      "https://customer-test123.cloudflarestream.com/stream123/iframe",
    ),
  )
  assert.ok(!sitemap.includes("javascript:"))
})

test("preview deployments expose no sitemap URLs and disallow crawling", () => {
  assert.ok(!buildSitemap(null, { preview: true }).includes("<loc>"))
  assert.equal(
    buildRobotsTxt({ preview: true }),
    "User-agent: *\nDisallow: /\n",
  )
  const production = buildRobotsTxt()
  assert.ok(production.includes(`Sitemap: ${SITE_URL}/sitemap.xml`))
  assert.ok(production.includes("Allow: /\n"))
  assert.ok(production.includes("Disallow: /api/\n"))
  assert.ok(!production.includes("Disallow: /\n"))
})

test("canonical URLs drop tracking parameters and media URLs require HTTP", () => {
  assert.equal(
    canonicalUrl("/works/film?utm_source=chatgpt.com#play"),
    `${SITE_URL}/works/film`,
  )
  assert.equal(absoluteUrl("/poster.jpg"), `${SITE_URL}/poster.jpg`)
  assert.equal(absoluteUrl("data:image/png;base64,123"), null)
  assert.equal(absoluteUrl(undefined), null)
})

test("organization markup follows CMS contact data and cannot close its script", () => {
  const data = organizationData({
    contact: {
      email: "info@example.com",
      addressLines: ["123 Example St", "Vancouver"],
      socials: {
        valid: "https://example.com/tagg",
        unsafe: "javascript:alert(1)",
        payload: "https://example.com/</script><script>alert(1)</script>",
      },
    },
  })
  assert.equal(data["@graph"][0].email, "info@example.com")
  assert.equal(data["@graph"][0].address, "123 Example St, Vancouver")
  assert.equal(data["@graph"][0].sameAs.length, 2)
  const encoded = serializeJsonLd({ ...data, test: "</script><script>" })
  assert.ok(!encoded.includes("</script>"))
  assert.equal(JSON.parse(encoded).test, "</script><script>")
})
