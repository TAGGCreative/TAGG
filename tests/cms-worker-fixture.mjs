import { readFileSync } from "node:fs"
import { Miniflare } from "miniflare"

export function createCmsWorker({ buckets, vars }) {
  return new Miniflare({
    enableDevRegistry: false,
    workers: [
      {
        config: {
          name: "cms-integration",
          compatibilityDate: "2026-07-11",
          compatibilityFlags: ["nodejs_compat"],
          manifest: {
            mainModule: "worker.js",
            modules: {
              "worker.js": {
                type: "esm",
                contents: readFileSync(
                  process.env.TAGG_CMS_WORKER_BUNDLE,
                  "utf8",
                ),
              },
            },
          },
          env: {
            DB: { type: "d1" },
            ...Object.fromEntries(
              buckets.map((name) => [name, { type: "r2" }]),
            ),
            ...Object.fromEntries(
              Object.entries(vars).map(([name, value]) => [
                name,
                { type: "text", value },
              ]),
            ),
          },
        },
      },
    ],
  })
}
