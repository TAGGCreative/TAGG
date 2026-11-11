import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createHmac } from "node:crypto"
import { once } from "node:events"
import { readFileSync } from "node:fs"
import { createServer } from "node:http"
import test from "node:test"

test(
  "a failed CMS feed preserves the last good pages and a retry refreshes both routes",
  { timeout: 30_000 },
  async () => {
    const media = JSON.parse(readFileSync("content/media-catalog.json", "utf8"))
    const editorial = JSON.parse(
      readFileSync("content/editorial-content.json", "utf8"),
    )
    const project = media.works[0]
    const path = `/works/${project.id}`
    const secret = "synthetic-refresh-test"
    let available = true
    let reads = 0
    const feed = createServer((_request, response) => {
      reads++
      response.writeHead(available ? 200 : 503, {
        "content-type": "application/json",
      })
      response.end(JSON.stringify(available ? { media, editorial } : {}))
    })
    feed.listen(0, "127.0.0.1")
    await once(feed, "listening")
    const next = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "0",
      ],
      {
        env: {
          ...process.env,
          TAGG_CMS_ENABLED: "true",
          CMS_PUBLISHED_CONTENT_URL: `http://127.0.0.1:${feed.address().port}/published`,
          CMS_REVALIDATE_SECRET: secret,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
    let logs = ""
    next.stderr.on("data", (chunk) => {
      logs += chunk
    })
    const stopped = once(next, "exit")
    try {
      const origin = await new Promise((resolve, reject) => {
        let output = ""
        next.stdout.on("data", (chunk) => {
          output += chunk
          const match = output.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+)/)
          if (match && /Ready in/.test(output)) resolve(match[1])
        })
        stopped.then(
          ([code]) =>
            reject(Error(`Next exited (${code}): ${logs}\n${output}`)),
          reject,
        )
      })
      const raw = JSON.stringify({ projectIds: [project.id] })
      const refresh = () =>
        fetch(origin + "/api/cms-revalidate", {
          method: "POST",
          headers: {
            "x-tagg-signature": createHmac("sha256", secret)
              .update(raw)
              .digest("hex"),
          },
          body: raw,
        })
      async function assertPages(title) {
        for (const route of ["/", path]) {
          const response = await fetch(origin + route)
          assert.equal(response.status, 200, route)
          assert.ok(
            (await response.text()).includes(title),
            `${route} should contain ${title}`,
          )
        }
      }
      project.title = "Synthetic last good publication"
      assert.equal((await refresh()).status, 200)
      await assertPages(project.title)

      available = false
      const beforeOutage = reads
      const failure = await refresh()
      assert.equal(failure.status, 502)
      assert.deepEqual(
        new Set((await failure.json()).failed),
        new Set(["/", path]),
      )
      assert.ok(reads > beforeOutage)
      await assertPages(project.title)

      available = true
      project.title = "Synthetic recovered publication"
      const recovered = await refresh()
      assert.equal(recovered.status, 200)
      assert.deepEqual(
        new Set((await recovered.json()).revalidated),
        new Set(["/", path]),
      )
      await assertPages(project.title)
    } finally {
      if (next.exitCode === null) next.kill()
      await stopped
      feed.closeAllConnections()
      await new Promise((resolve) => feed.close(resolve))
    }
  },
)
