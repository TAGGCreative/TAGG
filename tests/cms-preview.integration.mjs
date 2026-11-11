import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test from "node:test"

const cms = "http://127.0.0.1:8798"
const site = "http://127.0.0.1:3798"
const secret = "local-preview-synthetic"

test("only a valid, unexpired preview reveals the private draft on the public site", async () => {
  const bootstrap = await fetch(`${cms}/api/bootstrap`).then((r) => r.json())
  const title = `Synthetic preview ${Date.now()}`
  bootstrap.draft.media.works[0].title = title
  const save = await fetch(`${cms}/api/draft`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": bootstrap.draftMeta.etag,
    },
    body: JSON.stringify(bootstrap.draft),
  })
  assert.equal(save.status, 200)
  const created = await fetch(`${cms}/api/preview`, { method: "POST" })
  assert.equal(created.status, 200)
  const link = new URL((await created.json()).url)
  assert.equal(link.origin, site)
  const token = link.searchParams.get("token")
  const snapshot = `${cms}/api/private-preview/${token}`
  assert.equal((await fetch(snapshot)).status, 401)
  const serverAccess = await fetch(snapshot, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  assert.equal(serverAccess.status, 200)
  assert.equal(serverAccess.headers.get("cache-control"), "private, no-store")
  assert.equal((await serverAccess.json()).media.works[0].title, title)
  assert.doesNotMatch(
    await fetch(site).then((r) => r.text()),
    new RegExp(title),
  )

  const access = await fetch(link, { redirect: "manual" })
  assert.equal(access.status, 307)
  const cookie = access.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ")
  assert.match(
    await fetch(site, { headers: { cookie } }).then((r) => r.text()),
    new RegExp(title),
  )

  const expired = String(Math.floor(Date.now() / 1000) - 1)
  link.searchParams.set("expires", expired)
  link.searchParams.set(
    "signature",
    createHmac("sha256", secret).update(`${token}.${expired}`).digest("hex"),
  )
  const denied = await fetch(link, { redirect: "manual" })
  assert.equal(denied.status, 401)
  assert.equal(denied.headers.getSetCookie().length, 0)
})
