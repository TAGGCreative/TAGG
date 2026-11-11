import assert from "node:assert/strict"
import test from "node:test"
import { exportJWK, generateKeyPair, SignJWT } from "jose"
import { allowedEmail, isProcessor } from "../cms/auth.mjs"

const issuer = "https://tagg-fixture.cloudflareaccess.com"
const env = {
  ENVIRONMENT: "production",
  CF_ACCESS_ISSUER: issuer,
  CF_ACCESS_AUDIENCE: "synthetic-editor-app",
  ALLOWED_EDITOR_EMAILS: "editor@example.com",
  PROCESSOR_TOKEN: "synthetic-production-processor",
}
const request = (headers, host = "cms.example.com") =>
  new Request(`https://${host}/api/bootstrap`, { headers })

test("the CMS accepts only signed, current editor identities for its Access app", async (t) => {
  const { publicKey, privateKey } = await generateKeyPair("RS256")
  const key = { ...(await exportJWK(publicKey)), kid: "fixture", alg: "RS256" }
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(String(url), `${issuer}/cdn-cgi/access/certs`)
    return Response.json({ keys: [key] })
  })
  async function assertion(
    email,
    audience = env.CF_ACCESS_AUDIENCE,
    expires = "5m",
  ) {
    return new SignJWT({ email })
      .setProtectedHeader({ alg: "RS256", kid: "fixture" })
      .setSubject("synthetic-user")
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expires)
      .sign(privateKey)
  }
  const editor = async (jwt) =>
    allowedEmail(request({ "cf-access-jwt-assertion": jwt }), env)
  assert.equal(
    await editor(await assertion("EDITOR@example.com")),
    "editor@example.com",
  )
  assert.equal(await editor(await assertion("outsider@example.com")), null)
  assert.equal(
    await editor(await assertion("editor@example.com", "different-app")),
    null,
  )
  assert.equal(
    await editor(
      await assertion("editor@example.com", env.CF_ACCESS_AUDIENCE, 1),
    ),
    null,
  )
  assert.equal(
    await allowedEmail(
      request({ "cf-access-authenticated-user-email": "editor@example.com" }),
      env,
    ),
    null,
  )
})

test("the local processor credential is limited to loopback development", () => {
  const local = { authorization: "Bearer local-tagg-processor" }
  assert.equal(isProcessor(request(local, "localhost"), env), false)
  assert.equal(
    isProcessor(request(local), { ENVIRONMENT: "development" }),
    false,
  )
  assert.equal(
    isProcessor(request(local, "localhost"), { ENVIRONMENT: "development" }),
    true,
  )
  assert.equal(
    isProcessor(
      request({ authorization: `Bearer ${env.PROCESSOR_TOKEN}` }),
      env,
    ),
    true,
  )
  assert.equal(isProcessor(request({}), env), false)
})
