import crypto from "node:crypto"

function validToken(token) {
  return typeof token === "string" && /^[a-f0-9-]{20,64}$/i.test(token)
}

function safeReturnTo(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/"
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()
  const { token, signature, returnTo } = req.query
  const secret =
    process.env.CMS_PREVIEW_SECRET ||
    (process.env.VERCEL_ENV === "preview"
      ? "tagg-cms-preview-bridge-v1"
      : null)
  if (!validToken(token) || !secret) {
    return res.status(401).send("Invalid CMS preview link.")
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(token)
    .digest("hex")
  const supplied = String(signature || "")
  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  ) {
    return res.status(401).send("Invalid CMS preview signature.")
  }

  res.setPreviewData({ token }, { maxAge: 60 * 60 })
  return res.redirect(307, safeReturnTo(returnTo))
}
