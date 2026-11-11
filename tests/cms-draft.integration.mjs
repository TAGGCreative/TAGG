import assert from "node:assert/strict"
import test from "node:test"

const base = "http://127.0.0.1:8798"
const readDraft = async () => {
  const response = await fetch(`${base}/api/bootstrap`)
  assert.equal(response.status, 200)
  return response.json()
}
const saveDraft = (tab) =>
  fetch(`${base}/api/draft`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": tab.draftMeta.etag || '"legacy-unversioned"',
    },
    body: JSON.stringify(tab.draft),
  })

test("simultaneous editor saves accept exactly one copy of the same draft", async () => {
  const first = await readDraft()
  const second = await readDraft()
  first.draft.media.works[0].title = "First editor title"
  second.draft.media.works[0].title = "Stale editor title"
  const responses = await Promise.all([saveDraft(first), saveDraft(second)])
  assert.deepEqual(responses.map(({ status }) => status).sort(), [200, 412])
  const winner = responses[0].ok ? first : second
  const persisted = await readDraft()
  assert.equal(
    persisted.draft.media.works[0].title,
    winner.draft.media.works[0].title,
  )
  assert.equal(
    persisted.draftMeta.etag,
    (await responses.find(({ ok }) => ok).json()).etag,
  )
})

test("an editor must supply a draft version before saving", async () => {
  const response = await fetch(`${base}/api/draft`, { method: "PUT" })
  assert.equal(response.status, 428)
})
