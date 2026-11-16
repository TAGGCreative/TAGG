import { getSiteContent } from "../lib/siteContent"
import { buildSitemap } from "../lib/seo.mjs"

export async function getServerSideProps({ res }) {
  const preview = process.env.VERCEL_ENV === "preview"
  // Never use a CMS preview token here: discovery must reflect published work.
  const content = preview ? null : await getSiteContent()
  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60")
  res.end(buildSitemap(content, { preview }))
  return { props: {} }
}

export default function Sitemap() {
  return null
}
