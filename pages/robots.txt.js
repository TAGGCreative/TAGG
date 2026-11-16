import { buildRobotsTxt } from "../lib/seo.mjs"

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60")
  res.end(buildRobotsTxt({ preview: process.env.VERCEL_ENV === "preview" }))
  return { props: {} }
}

export default function Robots() {
  return null
}
