import { timingSafeEqual } from "node:crypto"
import { createRemoteJWKSet, jwtVerify } from "jose"

const accessKeys = new Map()

export function localDevelopment(request, env) {
  return (
    env.ENVIRONMENT === "development" &&
    ["localhost", "127.0.0.1"].includes(new URL(request.url).hostname)
  )
}

export function matchesSecret(supplied, expected) {
  if (!supplied || !expected) return false
  const actualBytes = Buffer.from(supplied)
  const expectedBytes = Buffer.from(expected)
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}

export async function allowedEmail(request, env) {
  if (localDevelopment(request, env)) return "local-editor@taggcreative.com"
  if (
    env.ENVIRONMENT === "preview" &&
    matchesSecret(
      request.headers.get("x-tagg-preview-token"),
      env.PREVIEW_EDITOR_TOKEN,
    )
  )
    return "preview-editor@taggcreative.com"

  const assertion = request.headers.get("cf-access-jwt-assertion")
  const issuer = env.CF_ACCESS_ISSUER
  const audience = env.CF_ACCESS_AUDIENCE
  if (
    !assertion ||
    !audience ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer || "")
  )
    return null

  try {
    if (!accessKeys.has(issuer))
      accessKeys.set(
        issuer,
        createRemoteJWKSet(new URL("/cdn-cgi/access/certs", issuer)),
      )
    const { payload } = await jwtVerify(assertion, accessKeys.get(issuer), {
      algorithms: ["RS256"],
      issuer,
      audience,
      requiredClaims: ["exp", "iat", "sub"],
    })
    if (typeof payload.email !== "string") return null
    const email = payload.email.trim().toLowerCase()
    const allowlist = String(env.ALLOWED_EDITOR_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
    return allowlist.includes(email) ? email : null
  } catch {
    return null
  }
}

export function isProcessor(request, env) {
  const authorization = request.headers.get("authorization")
  if (
    localDevelopment(request, env) &&
    authorization === "Bearer local-tagg-processor"
  )
    return true
  return (
    Boolean(env.PROCESSOR_TOKEN) &&
    matchesSecret(authorization, `Bearer ${env.PROCESSOR_TOKEN}`)
  )
}
