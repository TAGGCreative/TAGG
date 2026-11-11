import crypto from "node:crypto"

function verify(body, signature) {
  const secret = process.env.CMS_REVALIDATE_SECRET
  if (
    !secret ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  )
}

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (process.env.TAGG_CMS_ENABLED !== "true") return res.status(404).end()
  if (req.method !== "POST") return res.status(405).end()
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += chunk.length
    if (length > 64 * 1024)
      return res.status(413).json({ error: "Refresh request too large" })
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!verify(raw, req.headers["x-tagg-signature"])) {
    return res.status(401).json({ error: "Invalid signature" })
  }

  let projectIds
  try {
    projectIds = JSON.parse(raw).projectIds
  } catch {
    return res.status(400).json({ error: "Invalid refresh request" })
  }
  if (
    !Array.isArray(projectIds) ||
    projectIds.some(
      (id) => typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(id),
    )
  )
    return res.status(400).json({ error: "Invalid project IDs" })
  const paths = new Set(["/", ...projectIds.map((id) => `/works/${id}`)])
  const pending = [...paths]
  const revalidated = []
  const failed = []
  while (pending.length) {
    await Promise.all(
      pending.splice(0, 8).map(async (path) => {
        try {
          await res.revalidate(path)
          revalidated.push(path)
        } catch {
          failed.push(path)
        }
      }),
    )
  }
  return res.status(failed.length ? 502 : 200).json({ revalidated, failed })
}
