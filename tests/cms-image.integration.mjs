import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { Miniflare } from "miniflare"

test("a completed image attaches to the current draft or reports that its target was removed", async () => {
  const mf = new Miniflare({
    modules: true,
    script: readFileSync(process.env.TAGG_CMS_WORKER_BUNDLE, "utf8"),
    compatibilityDate: "2026-07-11",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    r2Buckets: ["MEDIA"],
    bindings: {
      ENVIRONMENT: "development",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
    },
  })
  try {
    const base = "http://localhost/api"
    const send = (path, body, options = {}) =>
      mf.dispatchFetch(base + path, {
        method: options.method || "POST",
        headers: { "Content-Type": "application/json", ...options.headers },
        body: JSON.stringify(body),
      })
    const read = () =>
      mf.dispatchFetch(base + "/bootstrap").then((r) => r.json())
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a37sAAAAASUVORK5CYII=",
      "base64",
    )
    async function stage(projectId) {
      const started = await send("/uploads/start", {
        projectId,
        role: "poster",
        type: "image/png",
        size: image.length,
        fileName: "fixture.png",
      })
      assert.equal(started.status, 200)
      const session = await started.json()
      const query = new URLSearchParams({
        key: session.key,
        uploadId: session.uploadId,
        partNumber: 1,
      })
      const part = await mf.dispatchFetch(
        base + "/uploads/part-data?" + query,
        {
          method: "PUT",
          headers: { "Content-Length": String(image.length) },
          body: image,
        },
      )
      assert.equal(part.status, 200)
      return {
        ...session,
        parts: [{ partNumber: 1, etag: part.headers.get("etag") }],
      }
    }
    const before = await read()
    const project = before.draft.media.works.find(
      (item) => !before.draft.media.carouselOrder.includes(item.id),
    )
    const uploaded = await stage(project.id)
    const completed = await send("/uploads/complete", uploaded)
    assert.equal(completed.status, 200)
    assert.equal((await completed.json()).status, "ready")
    const attached = await read()
    assert.equal(
      attached.draft.media.works.find((item) => item.id === project.id).poster
        .src,
      `https://media.example.com/${uploaded.key}`,
    )
    const replacing = await stage(project.id)
    attached.draft.media.works = attached.draft.media.works.filter(
      (item) => item.id !== project.id,
    )
    const save = await send("/draft", attached.draft, {
      method: "PUT",
      headers: { "If-Match": attached.draftMeta.etag },
    })
    assert.equal(save.status, 200)
    const refused = await send("/uploads/complete", replacing)
    assert.equal(refused.status, 409)
    const after = await read()
    assert.equal(
      after.jobs.find((job) => job.id === replacing.jobId).status,
      "error",
    )
    assert.ok(!after.draft.media.works.some((item) => item.id === project.id))
  } finally {
    await mf.dispose()
  }
})
