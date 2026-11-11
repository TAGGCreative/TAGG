// prettier-ignore
async (page) => {
  const url = page.url()
  const other = await page.context().newPage()
  try {
    await page.reload()
    await other.goto(url)
    const title = (tab) => tab.locator('input[data-path$=".title"]')
    await title(other).waitFor()
    const saved = "Synthetic browser winner " + Date.now()
    const unsaved = "Synthetic stale edit to preserve"
    const firstSave = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/draft") &&
        r.request().method() === "PUT" &&
        r.status() === 200,
    )
    await title(page).fill(saved)
    await firstSave
    const conflict = other.waitForResponse(
      (r) => r.url().endsWith("/api/draft") && r.status() === 412,
    )
    await title(other).fill(unsaved)
    await conflict
    await other.getByText(/Copy your unsaved edits/).waitFor()
    if ((await title(other).inputValue()) !== unsaved)
      throw Error("Unsaved text was lost")
    const previewConflict = other.waitForResponse(
      (r) => r.url().endsWith("/api/draft") && r.status() === 412,
    )
    await other
      .getByRole("button", { name: "Preview site", exact: true })
      .click()
    await previewConflict
    const persisted = await page.request
      .get(new URL("/api/bootstrap", url).href)
      .then((r) => r.json())
    if (persisted.draft.media.works[0].title !== saved)
      throw Error("Stale browser overwrote the draft")
    return { winningDraft: saved, staleTabRetained: unsaved }
  } finally {
    await other.close()
  }
}
