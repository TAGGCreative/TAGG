import crypto from "node:crypto"

function validToken(token) {
  return typeof token === "string" && /^[a-f0-9-]{36}$/.test(token)
}

function safeReturnTo(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\r\n\t]/.test(value)
    ? value
    : "/"
}

export default function handler(req, res) {
  if (process.env.TAGG_CMS_ENABLED !== "true") return res.status(404).end()
  if (req.method !== "GET") return res.status(405).end()
  const { token, signature, expires, returnTo } = req.query
  const secret = process.env.CMS_PREVIEW_SECRET
  const secondsLeft = Number(expires) - Math.floor(Date.now() / 1000)
  if (
    !validToken(token) ||
    !secret ||
    typeof expires !== "string" ||
    !/^\d{10}$/.test(expires) ||
    secondsLeft <= 0 ||
    secondsLeft > 3600
  ) {
    return res.status(401).send("Invalid CMS preview link.")
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${token}.${expires}`)
    .digest("hex")
  if (
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    !crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    )
  ) {
    return res.status(401).send("Invalid CMS preview signature.")
  }

  res.setHeader("Cache-Control", "private, no-store")
  res.setPreviewData({ token }, { maxAge: secondsLeft })
  return res.redirect(307, safeReturnTo(returnTo))
}
