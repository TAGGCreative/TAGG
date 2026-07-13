import crypto from "node:crypto"

function verify(body, signature) {
  const secret =
    process.env.CMS_REVALIDATE_SECRET ||
    (process.env.VERCEL_ENV === "preview"
      ? "tagg-cms-preview-bridge-v1"
      : null)
  if (!secret || !signature) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  const supplied = String(signature)
  return (
    supplied.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
}

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!verify(raw, req.headers["x-tagg-signature"])) {
    return res.status(401).json({ error: "Invalid signature" })
  }

  const payload = JSON.parse(raw || "{}")
  const paths = new Set([
    "/",
    ...(payload.projectIds || []).map((id) => `/works/${id}`),
  ])
  await Promise.all([...paths].map((path) => res.revalidate(path)))
  return res.json({ revalidated: [...paths] })
}
