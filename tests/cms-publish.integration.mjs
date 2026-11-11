import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { Miniflare } from "miniflare"

test("publish commits one reviewed draft and restore leaves the current revision live until republished", async () => {
  const mf = new Miniflare({
    modules: true,
    script: readFileSync(process.env.TAGG_CMS_WORKER_BUNDLE, "utf8"),
    compatibilityDate: "2026-07-11",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    r2Buckets: ["PRIVATE_MEDIA"],
    bindings: { ENVIRONMENT: "development" },
  })
  try {
    const base = "http://localhost/api"
    const read = (path) => mf.dispatchFetch(base + path).then((r) => r.json())
    const getDraft = () => read("/bootstrap")
    const write = (path, etag, body = {}, method = "POST") =>
      mf.dispatchFetch(base + path, {
        method,
        headers: { "If-Match": etag, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    const before = await getDraft()
    const title = before.draft.media.works[0].title
    before.draft.media.works[0].title = "Synthetic committed publication"
    const save = await write(
      "/draft",
      before.draftMeta.etag,
      before.draft,
      "PUT",
    )
    assert.equal(save.status, 200)
    const { etag } = await save.json()
    assert.equal((await write("/publish", before.draftMeta.etag)).status, 412)
    const started = await write("/uploads/start", etag, {
      projectId: before.draft.media.works[0].id,
      role: "main",
      type: "video/mp4",
      fileName: "fixture.mp4",
      size: 10,
    })
    assert.equal(started.status, 200)
    const upload = await started.json()
    const waiting = await write("/publish", etag)
    assert.equal(waiting.status, 409)
    assert.ok(
      (await waiting.json()).errors.includes(
        "Media is still uploading or processing.",
      ),
    )
    assert.equal((await write("/uploads/abort", etag, upload)).status, 200)
    const pair = await Promise.all([
      write("/publish", etag),
      write("/publish", etag),
    ])
    const winner = pair.find((r) => r.ok)
    assert.equal(pair.filter((r) => r.ok).length, 1)
    assert.ok([409, 412].includes(pair.find((r) => !r.ok).status))
    const { revisionId, propagation } = await winner.json()
    assert.equal(propagation, "pending")
    const result = await mf.dispatchFetch(base + "/published-content")
    assert.equal(result.headers.get("x-tagg-revision"), revisionId)
    assert.equal(
      (await result.json()).media.works[0].title,
      "Synthetic committed publication",
    )
    const after = await getDraft()
    assert.equal(
      after.revisions.filter(({ is_published }) => is_published).length,
      1,
    )
    const restored = await write(
      `/revisions/${before.publishedRevisionId}/restore`,
      after.draftMeta.etag,
    )
    assert.equal(restored.status, 200)
    assert.equal(
      (await read("/published-content")).media.works[0].title,
      "Synthetic committed publication",
    )
    const rollbackDraft = await getDraft()
    assert.equal(rollbackDraft.draft.media.works[0].title, title)
    assert.equal(
      (await write("/publish", rollbackDraft.draftMeta.etag)).status,
      200,
    )
    assert.equal((await read("/published-content")).media.works[0].title, title)
  } finally {
    await mf.dispose()
  }
})
