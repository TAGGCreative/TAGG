import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const catalog = JSON.parse(
  await readFile(
    new URL("../content/media-catalog.json", import.meta.url),
    "utf8",
  ),
)
const editorial = JSON.parse(
  await readFile(
    new URL("../content/editorial-content.json", import.meta.url),
    "utf8",
  ),
)

test("the imported portfolio has stable unique project IDs", () => {
  const ids = catalog.works.map((project) => project.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.length > 0)
  for (const project of catalog.works) {
    assert.ok(project.client)
    assert.ok(project.title)
    assert.ok(project.source?.url || project.source?.id)
  }
})

test("every imported carousel relationship remains complete", () => {
  const projectIds = new Set(catalog.works.map((project) => project.id))
  for (const clip of [
    ...catalog.carousels.desktop,
    ...catalog.carousels.mobile,
  ]) {
    assert.ok(clip.id)
    assert.ok(clip.projectId)
    assert.ok(projectIds.has(clip.projectId))
    assert.ok(clip.source?.url || clip.source?.id)
    assert.ok(clip.client)
    assert.ok(clip.title)
  }
})

test("the carousel has an explicit order independent of the work grid", () => {
  assert.ok(Array.isArray(catalog.carouselOrder))
  assert.equal(
    new Set(catalog.carouselOrder).size,
    catalog.carouselOrder.length,
  )
  assert.deepEqual(
    catalog.carousels.desktop.map((clip) => clip.projectId),
    catalog.carouselOrder,
  )
  assert.deepEqual(
    catalog.carousels.mobile.map((clip) => clip.projectId),
    catalog.carouselOrder,
  )
})

test("editorial fallback covers all CMS surfaces", () => {
  assert.equal(editorial.sections.core.length, 3)
  assert.equal(editorial.sections.ourArena.length, 4)
  assert.ok(editorial.sections.whoWeAre.paragraphs.length >= 2)
  assert.ok(editorial.people.leadership.length > 0)
  assert.ok(editorial.people.extended.length > 0)
  assert.match(editorial.contact.email, /@taggcreative\.com$/)
  assert.ok(editorial.contact.addressLines.length >= 3)
})
