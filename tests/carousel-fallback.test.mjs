import test from "node:test"
import assert from "node:assert/strict"
import { mobileCarouselClips } from "../lib/carouselClips.mjs"

const desktop = [
  {
    id: "alpha-desktop",
    projectId: "alpha",
    source: { provider: "hls", url: "/alpha-desktop.m3u8" },
    poster: { src: "/alpha.jpg" },
  },
  {
    id: "beta-desktop",
    projectId: "beta",
    source: { provider: "hls", url: "/beta-desktop.m3u8" },
    poster: { src: "/beta.jpg" },
  },
]

test("mobile carousel clips stay in desktop order and use custom vertical media", () => {
  const mobile = [
    {
      id: "beta-mobile",
      projectId: "beta",
      source: { provider: "hls", url: "/beta-mobile.m3u8" },
    },
  ]
  const result = mobileCarouselClips(desktop, mobile)

  assert.deepEqual(
    result.map((clip) => clip.projectId),
    ["alpha", "beta"],
  )
  assert.equal(result[1].source.url, "/beta-mobile.m3u8")
  assert.equal(result[1].poster.src, "/beta.jpg")
  assert.equal(result[1].mobileCropFallback, undefined)
})

test("missing vertical media falls back to a cropped desktop clip", () => {
  const [fallback] = mobileCarouselClips(desktop, [])

  assert.equal(fallback.source.url, "/alpha-desktop.m3u8")
  assert.equal(fallback.poster.src, "/alpha.jpg")
  assert.equal(fallback.mobileCropFallback, true)
})
