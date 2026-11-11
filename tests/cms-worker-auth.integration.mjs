import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import { createCmsWorker } from "./cms-worker-fixture.mjs"

test("a multipart upload resumes and a lost completion response can be retried", async () => {
  const mf = createCmsWorker({
    buckets: ["MEDIA", "PRIVATE_MEDIA"],
    vars: { ENVIRONMENT: "development" },
  })
  try {
    const base = "http://localhost/api"
    const post = (path, body) =>
      mf.dispatchFetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    const draft = await mf
      .dispatchFetch(base + "/bootstrap")
      .then((r) => r.json())
    const partSize = 64 * 1024 * 1024
    const started = await post("/uploads/start", {
      projectId: draft.draft.media.works[0].id,
      role: "main",
      type: "video/mp4",
      fileName: "synthetic-resume.mp4",
      size: partSize + 3,
    })
    assert.equal(started.status, 200)
    const session = await started.json()
    assert.equal(session.partSize, partSize)
    async function upload(partNumber, body) {
      const query = new URLSearchParams({
        key: session.key,
        uploadId: session.uploadId,
        partNumber,
      })
      const part = await mf.dispatchFetch(
        base + "/uploads/part-data?" + query,
        {
          method: "PUT",
          headers: { "Content-Length": String(body.byteLength) },
          body,
        },
      )
      assert.equal(part.status, 200, part.ok ? undefined : await part.text())
      return { partNumber, etag: part.headers.get("etag") }
    }
    const first = await upload(1, new Uint8Array(partSize))
    const resumed = JSON.parse(JSON.stringify({ ...session, parts: [first] }))
    resumed.parts.push(await upload(2, Uint8Array.of(7, 8, 9)))
    const completion = await post("/uploads/complete", resumed)
    assert.equal(completion.status, 200)
    assert.equal((await completion.json()).status, "waiting")
    const replay = await post("/uploads/complete", resumed)
    assert.equal(replay.status, 200)
    assert.equal((await replay.json()).status, "waiting")
    const bucket = await mf.getR2Bucket("PRIVATE_MEDIA")
    const object = await bucket.get(session.key, { range: { suffix: 3 } })
    assert.equal(object.size, partSize + 3)
    assert.deepEqual(
      new Uint8Array(await object.arrayBuffer()),
      Uint8Array.of(7, 8, 9),
    )
    const jobs = await mf.dispatchFetch(base + "/jobs").then((r) => r.json())
    assert.equal(jobs.jobs.filter((job) => job.id === session.jobId).length, 1)
  } finally {
    await mf.dispose()
  }
})

test("a reclaimed processing job ignores the previous processor's updates", async () => {
  const mf = createCmsWorker({
    buckets: ["MEDIA"],
    vars: {
      ENVIRONMENT: "development",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
    },
  })
  try {
    const base = "http://localhost/api/processor/jobs"
    const headers = {
      Authorization: "Bearer local-tagg-processor",
      "Content-Type": "application/json",
    }
    await mf.dispatchFetch(`${base}/next`, { headers })
    const draft = await mf
      .dispatchFetch("http://localhost/api/bootstrap")
      .then((r) => r.json())
    const projectId = draft.draft.media.works[0].id
    const db = await mf.getD1Database("DB")
    await db
      .prepare(
        "INSERT INTO processing_jobs (id, project_id, asset_role, object_key, original_name, mime_type, size_bytes, status, attempts, lease_until, created_at, updated_at, created_by) VALUES ('synthetic', ?, 'main', 'fixture', 'fixture.mp4', 'video/mp4', 1, 'processing', 1, ?, ?, ?, 'fixture')",
      )
      .bind(projectId, "2000-01-01T00:00:00.000Z", "2000-01-01", "2000-01-01")
      .run()
    const { job } = await mf
      .dispatchFetch(`${base}/next`, { headers })
      .then((r) => r.json())
    assert.equal(job.attempts, 2)
    assert.match(job.outputPrefix, /\/attempt-2$/)
    const update = (attempt, action, body = { progress: 45 }) =>
      mf.dispatchFetch(`${base}/synthetic/${action}`, {
        method: "POST",
        headers: { ...headers, "x-tagg-job-attempt": String(attempt) },
        body: JSON.stringify(body),
      })
    for (const action of ["progress", "error", "complete", "upload-url"])
      assert.equal((await update(1, action)).status, 409)
    assert.equal((await update(2, "progress")).status, 200)
    const masterKey = `${job.outputPrefix}/master.m3u8`
    const scrubKey = `${job.outputPrefix}/scrub.mp4`
    const output = { masterKey, scrubKey }
    assert.equal((await update(2, "complete", { output })).status, 409)
    const media = await mf.getR2Bucket("MEDIA")
    await media.put(
      masterKey,
      "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=100\n360p/index.m3u8\n",
    )
    await media.put(scrubKey, "synthetic bytes")
    assert.equal((await update(2, "complete", { output })).status, 409)
    await media.put(
      `${job.outputPrefix}/360p/index.m3u8`,
      '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:1.0,\nsegment_00000.m4s\n#EXT-X-ENDLIST\n',
    )
    await media.put(`${job.outputPrefix}/360p/init.mp4`, "synthetic init")
    assert.equal((await update(2, "complete", { output })).status, 409)
    await media.put(
      `${job.outputPrefix}/360p/segment_00000.m4s`,
      "synthetic segment",
    )
    const getDraft = () =>
      mf.dispatchFetch("http://localhost/api/bootstrap").then((r) => r.json())
    const title = "Concurrent editorial change"
    const saveTitle = (current) => {
      current.draft.media.works[0].title = title
      return mf.dispatchFetch("http://localhost/api/draft", {
        method: "PUT",
        headers: {
          "If-Match": current.draftMeta.etag,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(current.draft),
      })
    }
    const before = await getDraft()
    const [saved, completed] = await Promise.all([
      saveTitle(before),
      update(2, "complete", { output }),
    ])
    assert.equal(completed.status, 200)
    if (saved.status === 412)
      assert.equal((await saveTitle(await getDraft())).status, 200)
    else assert.equal(saved.status, 200)
    assert.equal((await update(2, "complete", { output })).status, 200)
    const persisted = await mf
      .dispatchFetch("http://localhost/api/bootstrap")
      .then((r) => r.json())
    assert.equal(
      persisted.jobs.find((item) => item.id === job.id).status,
      "ready",
    )
    assert.equal(
      persisted.draft.media.works[0].source.url,
      `https://media.example.com/${masterKey}`,
    )
    assert.equal(persisted.draft.media.works[0].title, title)
  } finally {
    await mf.dispose()
  }
})

test("production Worker denies expired private snapshots and development credentials", async () => {
  const secret = "synthetic-server-preview-secret"
  const processor = "synthetic-server-processor-secret"
  const mf = createCmsWorker({
    buckets: ["PRIVATE_MEDIA"],
    vars: {
      ENVIRONMENT: "production",
      ALLOWED_EDITOR_EMAILS: "editor@example.com",
      PREVIEW_SECRET: secret,
      PROCESSOR_TOKEN: processor,
    },
  })
  try {
    const cms = "http://localhost"
    const token = randomUUID()
    const bucket = await mf.getR2Bucket("PRIVATE_MEDIA")
    await bucket.put(`cms/previews/${token}.json`, '{"fixture":"expired"}', {
      customMetadata: { expiresAt: String(Math.floor(Date.now() / 1000) - 1) },
    })
    const snapshot = `${cms}/api/private-preview/${token}`
    assert.equal((await mf.dispatchFetch(snapshot)).status, 401)
    assert.equal(
      (
        await mf.dispatchFetch(snapshot, {
          headers: { Authorization: `Bearer ${secret}` },
        })
      ).status,
      410,
    )
    assert.equal(
      (
        await mf.dispatchFetch(`${cms}/api/bootstrap`, {
          headers: {
            "cf-access-authenticated-user-email": "editor@example.com",
          },
        })
      ).status,
      403,
    )
    const next = `${cms}/api/processor/jobs/next`
    assert.equal(
      (
        await mf.dispatchFetch(next, {
          headers: { Authorization: "Bearer local-tagg-processor" },
        })
      ).status,
      401,
    )
    const authorized = await mf.dispatchFetch(next, {
      headers: { Authorization: `Bearer ${processor}` },
    })
    assert.equal(authorized.status, 200)
    assert.deepEqual(await authorized.json(), { job: null })
  } finally {
    await mf.dispose()
  }
})
