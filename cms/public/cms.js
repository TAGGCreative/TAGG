const app = document.querySelector("#app")
const state = {
  tab: "projects",
  content: null,
  jobs: [],
  revisions: [],
  user: null,
  selectedProjectId: null,
  dirty: false,
  saving: false,
  savedAt: null,
  publishedRevisionId: null,
  drawer: false,
  toast: null,
  saveTimer: null,
}

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const previewAccess =
  location.hostname.endsWith(".workers.dev") ||
  location.hostname === "cms-preview.taggcreative.com"

function previewAccessToken() {
  if (!previewAccess) return ""
  let token = sessionStorage.getItem("tagg-preview-access") || ""
  if (!token) {
    token = prompt("Enter the TAGG preview access code")?.trim() || ""
    if (token) sessionStorage.setItem("tagg-preview-access", token)
  }
  return token
}

async function api(path, options = {}) {
  const previewToken = previewAccessToken()
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(previewToken ? { "x-tagg-preview-token": previewToken } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 403 && previewAccess)
      sessionStorage.removeItem("tagg-preview-access")
    const message =
      [data.error, ...(data.errors || [])].filter(Boolean).join(" ") ||
      `Request failed (${response.status})`
    throw new Error(message)
  }
  return data
}

function notify(message, error = false) {
  state.toast = { message, error }
  render()
  setTimeout(() => {
    if (state.toast?.message === message) {
      state.toast = null
      render()
    }
  }, 4500)
}

function getAtPath(path) {
  return path
    .split(".")
    .reduce(
      (value, key) => value?.[Number.isNaN(Number(key)) ? key : Number(key)],
      state.content,
    )
}

function setAtPath(path, value) {
  const keys = path.split(".")
  const last = keys.pop()
  const parent = keys.reduce(
    (object, key) => object[Number.isNaN(Number(key)) ? key : Number(key)],
    state.content,
  )
  parent[Number.isNaN(Number(last)) ? last : Number(last)] = value
  markDirty()
}

function markDirty() {
  state.dirty = true
  clearTimeout(state.saveTimer)
  state.saveTimer = setTimeout(saveDraft, 650)
  updateSaveState()
}

async function saveDraft() {
  if (!state.dirty || state.saving) return
  state.saving = true
  updateSaveState()
  try {
    const result = await api("/api/draft", {
      method: "PUT",
      body: JSON.stringify(state.content),
    })
    state.dirty = false
    state.savedAt = result.savedAt
  } catch (error) {
    notify(error.message, true)
  } finally {
    state.saving = false
    updateSaveState()
  }
}

function updateSaveState() {
  const element = document.querySelector(".save-state")
  if (!element) return
  element.innerHTML = state.saving
    ? "Saving draft…"
    : state.dirty
      ? "Unsaved changes"
      : `<strong>Draft saved</strong>${state.savedAt ? ` · ${new Date(state.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`
}

function jobFor(projectId, role) {
  return (
    state.jobs.find(
      (job) =>
        job.project_id === projectId &&
        job.asset_role === role &&
        job.status !== "ready",
    ) ||
    state.jobs.find(
      (job) => job.project_id === projectId && job.asset_role === role,
    )
  )
}

function statusLabel(job, ready) {
  if (!job) return ready ? ["ready", "Ready"] : ["", "Drop file"]
  return (
    {
      uploading: ["uploading", "Uploading"],
      waiting: ["waiting", "Waiting for TAGG Mac"],
      processing: ["processing", "Processing"],
      ready: ["ready", "Ready"],
      error: ["error", "Needs attention"],
    }[job.status] || ["", job.status]
  )
}

function uploadCard(
  projectId,
  role,
  title,
  hint,
  ready = false,
  accept = "video/*",
) {
  const job = jobFor(projectId, role)
  const [statusClass, label] = statusLabel(job, ready)
  return `<label class="drop" data-drop="${escapeHtml(projectId)}:${role}">
    <input type="file" accept="${accept}" data-upload="${escapeHtml(projectId)}:${role}" />
    <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(hint)}</small></span>
    <span class="status ${statusClass}"><span class="dot"></span>${escapeHtml(job?.error || label)}</span>
    ${job?.status === "error" && ["main", "heroDesktop", "heroMobile"].includes(role) ? `<span class="button" role="button" tabindex="0" data-retry-job="${job.id}">Retry processing</span>` : ""}
    ${job && ["uploading", "processing"].includes(job.status) ? `<span class="progress"><span style="width:${Number(job.progress || 0)}%"></span></span>` : ""}
  </label>`
}

function projectList() {
  return state.content.media.works
    .map(
      (project, index) => `
    <div class="project-item ${state.selectedProjectId === project.id ? "active" : ""}" role="button" tabindex="0" draggable="true" data-project="${escapeHtml(project.id)}" data-index="${index}">
      <span class="grip" aria-hidden="true">⠿</span>
      <span><strong>${escapeHtml(project.client || "New project")}</strong><small>${escapeHtml(project.title || "Untitled")}</small></span>
      <span class="order-buttons">
        <button type="button" data-move="${index}:-1" aria-label="Move project up">⌃</button>
        <button type="button" data-move="${index}:1" aria-label="Move project down">⌄</button>
      </span>
    </div>`,
    )
    .join("")
}

function creditsToText(credits = {}) {
  return Object.entries(credits)
    .map(([role, name]) => `${role}: ${name}`)
    .join("\n")
}

function textToCredits(value) {
  return Object.fromEntries(
    value
      .split("\n")
      .map((line) => {
        const colon = line.indexOf(":")
        return colon > 0
          ? [line.slice(0, colon).trim(), line.slice(colon + 1).trim()]
          : null
      })
      .filter(Boolean),
  )
}

function projectsView() {
  const project =
    state.content.media.works.find(
      (item) => item.id === state.selectedProjectId,
    ) || state.content.media.works[0]
  if (project && !state.selectedProjectId) state.selectedProjectId = project.id
  return `<div class="page-head">
      <div><span class="eyebrow">Portfolio</span><h1>Projects</h1></div>
      <button class="button primary" data-action="add-project">+ New project</button>
    </div>
    <div class="project-layout">
      <section class="panel"><div class="panel-head"><h2>Work order</h2><span class="muted">Drag to reorder</span></div><div class="project-list">${projectList()}</div></section>
      <section class="panel">${project ? projectEditor(project) : `<div class="editor muted">Add your first project.</div>`}</section>
    </div>`
}

function projectEditor(project) {
  const path = `media.works.${state.content.media.works.indexOf(project)}`
  return `<div class="panel-head"><h2>${escapeHtml(project.client || "New project")}</h2><button class="button ghost danger" data-action="delete-project">Remove</button></div>
  <div class="editor form-grid">
    <div class="field"><label>Client</label><input data-path="${path}.client" value="${escapeHtml(project.client)}" /></div>
    <div class="field"><label>Project title</label><input data-path="${path}.title" value="${escapeHtml(project.title)}" /></div>
    <div class="field"><label>Stable ID / URL</label><input data-path="${path}.id" value="${escapeHtml(project.id)}" disabled /></div>
    <label class="check"><input type="checkbox" data-path="${path}.visible" ${project.visible !== false ? "checked" : ""}/> Visible on site</label>
    <div class="field full"><label>Credits · one “Role: Name” per line</label><textarea data-credits="${path}.credits">${escapeHtml(creditsToText(project.credits))}</textarea></div>
    <div class="media-grid">
      ${uploadCard(project.id, "main", "Full film", "Drop the master video", Boolean(project.source?.url))}
      ${uploadCard(
        project.id,
        "heroDesktop",
        "Desktop hero",
        "Optional wide clip",
        state.content.media.carousels.desktop.some(
          (clip) => clip.projectId === project.id,
        ),
      )}
      ${uploadCard(
        project.id,
        "heroMobile",
        "Mobile hero",
        "Optional vertical clip",
        state.content.media.carousels.mobile.some(
          (clip) => clip.projectId === project.id,
        ),
      )}
      ${uploadCard(project.id, "poster", "Poster", "Optional custom image", Boolean(project.poster?.src), "image/*")}
    </div>
    <div class="full">${carouselEditPack(project)}</div>
  </div>`
}

function normalizeCarouselContent() {
  const media = state.content.media
  media.carousels ||= { desktop: [], mobile: [] }
  media.carousels.desktop ||= []
  media.carousels.mobile ||= []
  media.carouselSettings ||= {}
  const validIds = new Set(media.works.map((project) => project.id))
  media.carouselOrder = [
    ...new Set([
      ...(media.carouselOrder || []),
      ...media.carousels.desktop.map((clip) => clip.projectId),
      ...media.carousels.mobile.map((clip) => clip.projectId),
    ]),
  ].filter((id) => validIds.has(id))
  for (const projectId of media.carouselOrder) {
    const settings = (media.carouselSettings[projectId] ||= {})
    if (typeof settings.approved !== "boolean")
      settings.approved = ["desktop", "mobile"].every((format) =>
        media.carousels[format].some(
          (clip) => clip.projectId === projectId && clip.source,
        ),
      )
    delete settings.framing
    delete settings.focusBias
  }
  sortCarouselCollections()
}

function sortCarouselCollections() {
  const media = state.content.media
  const order = new Map(
    (media.carouselOrder || []).map((projectId, index) => [projectId, index]),
  )
  for (const format of ["desktop", "mobile"]) {
    media.carousels[format] = media.carousels[format]
      .filter((clip) => order.has(clip.projectId))
      .sort((a, b) => order.get(a.projectId) - order.get(b.projectId))
  }
}

function carouselClip(projectId, format) {
  return state.content.media.carousels[format].find(
    (clip) => clip.projectId === projectId,
  )
}

function carouselJob(projectId, format) {
  const roles =
    format === "mobile"
      ? ["heroMobile"]
      : ["carouselDesktopFromMaster", "heroDesktop"]
  return roles
    .map((role) => jobFor(projectId, role))
    .find((job) => job && job.status !== "ready")
}

function carouselAsset(project, format) {
  const clip = carouselClip(project.id, format)
  const job = carouselJob(project.id, format)
  const role = format === "mobile" ? "heroMobile" : "heroDesktop"
  const ready = Boolean(clip?.source?.url || clip?.source?.id)
  const [statusClass, status] = statusLabel(job, ready)
  const generatedDesktop =
    format === "desktop" && project.carouselDraft?.desktopSource?.url
  const canGenerateDesktop = format === "desktop" && project.source?.url
  return `<div class="carousel-asset ${format}">
    <div class="asset-preview" style="${clip?.poster?.src || project.poster?.src ? `background-image:url('${escapeHtml(clip?.poster?.src || project.poster?.src)}')` : ""}"><span>${format === "mobile" ? "9:16" : "16:9"}</span></div>
    <div class="asset-copy"><strong>${format === "mobile" ? "Mobile from Resolve" : "Desktop carousel"}</strong><span class="status ${statusClass}"><span class="dot"></span>${escapeHtml(job?.error || status)}</span></div>
    <div class="asset-actions">
      ${generatedDesktop ? `<button class="button small" data-use-generated="${escapeHtml(project.id)}">${ready ? "Replace with generated cut" : "Use generated cut"}</button>` : ""}
      ${canGenerateDesktop ? `<button class="button small ghost" data-generate-existing="${escapeHtml(project.id)}" ${job ? "disabled" : ""}>${job ? "Generating…" : generatedDesktop ? "Regenerate from master" : "Generate from existing master"}</button>` : ""}
      <label class="button small ghost upload-button">Upload custom<input type="file" accept="video/*" data-upload="${escapeHtml(project.id)}:${role}" /></label>
    </div>
    ${job && ["waiting", "processing", "uploading"].includes(job.status) ? `<span class="progress"><span style="width:${Number(job.progress || 0)}%"></span></span>` : ""}
  </div>`
}

function carouselEditPack(project) {
  const draft = project.carouselDraft
  if (!draft?.roughcutUrl && !draft?.clipUrls?.length)
    return `<div class="edit-pack pending"><span><strong>Resolve edit pack</strong><small>Upload the main master to generate downloadable scene clips.</small></span></div>`
  return `<div class="edit-pack">
    <span><strong>Resolve edit pack</strong><small>Download the rough cut or source clips, reframe them in Resolve, then upload the finished mobile video above.</small></span>
    <div class="edit-pack-links">
      ${draft.roughcutUrl ? `<a class="button small" href="${escapeHtml(draft.roughcutUrl)}" download>Download rough cut</a>` : ""}
      ${(draft.clipUrls || []).map((url, index) => `<a class="button small ghost" href="${escapeHtml(url)}" download>Clip ${String(index + 1).padStart(2, "0")}</a>`).join("")}
    </div>
  </div>`
}

function carouselCard(project, index) {
  const settings = state.content.media.carouselSettings[project.id] || {}
  const readyToReview = ["desktop", "mobile"].every((format) =>
    Boolean(carouselClip(project.id, format)?.source),
  )
  return `<article class="carousel-card" draggable="true" data-carousel-item="${escapeHtml(project.id)}" data-carousel-index="${index}">
    <div class="carousel-card-head">
      <span class="grip" aria-hidden="true">⠿</span>
      <span class="carousel-number">${String(index + 1).padStart(2, "0")}</span>
      <div><strong>${escapeHtml(project.client)}</strong><small>${escapeHtml(project.title)}</small></div>
      <div class="order-buttons horizontal">
        <button type="button" data-carousel-move="${index}:-1" aria-label="Move carousel project up">←</button>
        <button type="button" data-carousel-move="${index}:1" aria-label="Move carousel project down">→</button>
      </div>
      <button class="button ghost danger small" data-carousel-remove="${escapeHtml(project.id)}">Remove</button>
    </div>
    <div class="carousel-assets">
      ${carouselAsset(project, "desktop")}
      ${carouselAsset(project, "mobile")}
    </div>
    ${carouselEditPack(project)}
    <div class="approval-row">
      <span><strong>${readyToReview ? "Ready for your review" : "Waiting for both formats"}</strong><small>${readyToReview ? "Use Preview site below, then approve this project for publishing." : "Approval unlocks after desktop and mobile clips are ready."}</small></span>
      <label class="approval-check"><input type="checkbox" data-carousel-approved="${escapeHtml(project.id)}" ${settings.approved ? "checked" : ""} ${readyToReview ? "" : "disabled"}/> Approved</label>
    </div>
  </article>`
}

function carouselView() {
  normalizeCarouselContent()
  const order = state.content.media.carouselOrder
  const selected = order
    .map((id) => state.content.media.works.find((project) => project.id === id))
    .filter(Boolean)
  const selectedIds = new Set(order)
  const available = state.content.media.works.filter(
    (project) => project.visible !== false && !selectedIds.has(project.id),
  )
  return `<div class="page-head">
    <div><span class="eyebrow">Homepage feature</span><h1>Carousel</h1></div>
    <div class="carousel-summary"><strong>${selected.length}</strong><span>projects selected</span></div>
  </div>
  <div class="carousel-layout">
    <section class="carousel-stage">
      <div class="section-intro"><div><h2>Featured order</h2><p>Drag projects into the exact order they should appear. This no longer follows the Work grid.</p></div></div>
      <div class="carousel-list">${selected.length ? selected.map(carouselCard).join("") : `<div class="empty-state">Add a project below to begin the homepage carousel.</div>`}</div>
    </section>
    <aside class="available-panel">
      <div class="panel-head"><div><h2>Available projects</h2><small class="muted">Add, then generate or upload its clips.</small></div></div>
      <div class="available-list">${
        available
          .map(
            (project) =>
              `<div class="available-item"><span><strong>${escapeHtml(project.client)}</strong><small>${escapeHtml(project.title)}</small></span><button class="button small" data-carousel-add="${escapeHtml(project.id)}">Add</button></div>`,
          )
          .join("") ||
        `<div class="empty-state compact">Every visible project is already selected.</div>`
      }</div>
    </aside>
  </div>`
}

function copyCard(title, item, path, eyebrow = false) {
  return `<section class="copy-card"><h2>${escapeHtml(title)}</h2>
    <div class="form-grid">
      <div class="field full"><label>${eyebrow ? "Eyebrow" : "Heading"}</label><input data-path="${path}.${eyebrow ? "eyebrow" : "heading"}" value="${escapeHtml(item[eyebrow ? "eyebrow" : "heading"])}" /></div>
      <div class="field full"><label>Paragraphs · separate with a blank line</label><textarea data-paragraphs="${path}.paragraphs">${escapeHtml(item.paragraphs.join("\n\n"))}</textarea></div>
    </div></section>`
}

function copyView() {
  const sections = state.content.editorial.sections
  return `<div class="page-head"><div><span class="eyebrow">Words, not layouts</span><h1>Site Copy</h1></div><span class="muted">Design stays safely locked.</span></div>
  <div class="copy-grid">
    ${copyCard("Who We Are", sections.whoWeAre, "editorial.sections.whoWeAre", true)}
    ${sections.core.map((item, index) => copyCard(`Core · ${index + 1}`, item, `editorial.sections.core.${index}`)).join("")}
    ${sections.ourArena.map((item, index) => copyCard(`Our Arena · ${index + 1}`, item, `editorial.sections.ourArena.${index}`)).join("")}
  </div>`
}

function personCard(person, group, index) {
  const path = `editorial.people.${group}.${index}`
  return `<section class="person-card"><div class="row" style="justify-content:space-between"><h2>${escapeHtml(`${person.given} ${person.sur}`)}</h2><button class="button ghost danger" data-remove-person="${group}:${index}">Remove</button></div>
    <div class="form-grid">
      <div class="field"><label>First / given</label><input data-path="${path}.given" value="${escapeHtml(person.given)}" /></div>
      <div class="field"><label>Last / surname</label><input data-path="${path}.sur" value="${escapeHtml(person.sur)}" /></div>
      <div class="field full"><label>Role</label><input data-path="${path}.role" value="${escapeHtml(person.role)}" /></div>
      <div class="field full"><label>Bio</label><textarea data-path="${path}.bio">${escapeHtml(person.bio)}</textarea></div>
      <div class="media-grid">
        ${uploadCard(person.id, "head", "Portrait", "Drop replacement image", Boolean(person.head), "image/*")}
        ${uploadCard(person.id, "mask", "Pink overlay", "Drop replacement image", Boolean(person.mask), "image/*")}
      </div>
    </div></section>`
}

function peopleView() {
  const { leadership, extended } = state.content.editorial.people
  const contact = state.content.editorial.contact
  return `<div class="page-head"><div><span class="eyebrow">Team and details</span><h1>People & Contact</h1></div></div>
  <div class="copy-grid">
    <section class="copy-card"><h2>Contact</h2><div class="form-grid">
      <div class="field"><label>Email</label><input data-path="editorial.contact.email" value="${escapeHtml(contact.email)}" /></div>
      <div class="field"><label>Map link</label><input data-path="editorial.contact.mapUrl" value="${escapeHtml(contact.mapUrl)}" /></div>
      <div class="field full"><label>Address · one line per row</label><textarea data-lines="editorial.contact.addressLines">${escapeHtml(contact.addressLines.join("\n"))}</textarea></div>
      ${Object.entries(contact.socials)
        .map(
          ([name, url]) =>
            `<div class="field"><label>${escapeHtml(name)}</label><input data-path="editorial.contact.socials.${name}" value="${escapeHtml(url)}" /></div>`,
        )
        .join("")}
    </div></section>
    <div class="row" style="justify-content:space-between"><h2>Leadership</h2><button class="button" data-add-person="leadership">+ Add person</button></div><div class="people-grid">${leadership.map((person, index) => personCard(person, "leadership", index)).join("")}</div>
    <div class="row" style="justify-content:space-between"><h2>Extended family</h2><button class="button" data-add-person="extended">+ Add person</button></div><div class="people-grid">${extended.map((person, index) => personCard(person, "extended", index)).join("")}</div>
  </div>`
}

function revisionsDrawer() {
  if (!state.drawer) return ""
  return `<div class="drawer-backdrop" data-action="close-drawer"></div><aside class="drawer" aria-label="Version history">
    <div class="row" style="justify-content:space-between"><div><span class="eyebrow">Safety net</span><h2>Version history</h2></div><button class="button ghost" data-action="close-drawer">Close</button></div>
    ${state.revisions.map((revision) => `<div class="revision"><strong>${escapeHtml(revision.label)}</strong><small>${new Date(revision.created_at).toLocaleString()} · ${escapeHtml(revision.created_by)}${revision.is_published ? " · Live" : ""}</small><button class="button" data-restore="${revision.id}">Restore to draft</button></div>`).join("")}
  </aside>`
}

function render() {
  if (!state.content) return
  const view =
    state.tab === "projects"
      ? projectsView()
      : state.tab === "carousel"
        ? carouselView()
        : state.tab === "copy"
          ? copyView()
          : peopleView()
  app.innerHTML = `<div class="shell">
    <aside class="rail"><div class="brand"><span class="mark">T</span><span><strong>TAGG</strong><small>Content Room</small></span></div>
      <nav class="nav" aria-label="CMS sections">
        <button class="${state.tab === "projects" ? "active" : ""}" data-tab="projects">Projects</button>
        <button class="${state.tab === "carousel" ? "active" : ""}" data-tab="carousel">Carousel</button>
        <button class="${state.tab === "copy" ? "active" : ""}" data-tab="copy">Site Copy</button>
        <button class="${state.tab === "people" ? "active" : ""}" data-tab="people">People & Contact</button>
      </nav><div class="account">Signed in as<br>${escapeHtml(state.user.email)}</div>
    </aside>
    <main class="main">${view}</main>
  </div>
  <footer class="publish-bar"><span class="save-state"></span><div class="row"><button class="button ghost" data-action="history">History</button><button class="button" data-action="preview">Preview site</button><button class="button primary" data-action="publish">Publish</button></div></footer>
  ${revisionsDrawer()}${state.toast ? `<div class="toast ${state.toast.error ? "error" : ""}">${escapeHtml(state.toast.message)}</div>` : ""}`
  bindEvents()
  updateSaveState()
}

function moveProject(index, direction) {
  const projects = state.content.media.works
  const next = Math.max(0, Math.min(projects.length - 1, index + direction))
  if (next === index) return
  const [project] = projects.splice(index, 1)
  projects.splice(next, 0, project)
  markDirty()
  render()
}

function moveCarouselProject(index, direction) {
  const order = state.content.media.carouselOrder
  const next = Math.max(0, Math.min(order.length - 1, index + direction))
  if (next === index) return
  const [projectId] = order.splice(index, 1)
  order.splice(next, 0, projectId)
  sortCarouselCollections()
  markDirty()
  render()
}

function addCarouselProject(projectId) {
  normalizeCarouselContent()
  if (!state.content.media.carouselOrder.includes(projectId))
    state.content.media.carouselOrder.push(projectId)
  state.content.media.carouselSettings[projectId] ||= {
    approved: false,
  }
  markDirty()
  render()
}

function removeCarouselProject(projectId) {
  const project = state.content.media.works.find(
    (item) => item.id === projectId,
  )
  if (
    !confirm(
      `Remove ${project?.client || "this project"} from the homepage carousel? Its project page and uploaded media will stay intact.`,
    )
  )
    return
  state.content.media.carouselOrder = state.content.media.carouselOrder.filter(
    (id) => id !== projectId,
  )
  for (const format of ["desktop", "mobile"])
    state.content.media.carousels[format] = state.content.media.carousels[
      format
    ].filter((clip) => clip.projectId !== projectId)
  delete state.content.media.carouselSettings[projectId]
  markDirty()
  render()
}

async function useGeneratedCarousel(projectId) {
  await saveDraft()
  try {
    await api(
      `/api/projects/${encodeURIComponent(projectId)}/carousel/use-generated`,
      { method: "POST", body: "{}" },
    )
    notify("Generated desktop cut added to the carousel draft.")
    await load(false)
  } catch (error) {
    notify(error.message, true)
  }
}

async function generateDesktopFromMaster(projectId) {
  await saveDraft()
  try {
    const result = await api(
      `/api/projects/${encodeURIComponent(projectId)}/carousel/generate-from-master`,
      { method: "POST", body: "{}" },
    )
    notify(
      result.existing
        ? "That desktop carousel cut is already processing."
        : "Existing master queued. The desktop cut and Resolve clips are being created.",
    )
    await load(false)
  } catch (error) {
    notify(error.message, true)
  }
}

function addProject() {
  const id = `project-${Date.now().toString(36)}`
  state.content.media.works.unshift({
    id,
    client: "",
    title: "",
    credits: {},
    visible: true,
    source: null,
    poster: null,
    preview: null,
  })
  state.selectedProjectId = id
  markDirty()
  render()
}

function deleteProject() {
  const project = state.content.media.works.find(
    (item) => item.id === state.selectedProjectId,
  )
  if (
    !project ||
    !confirm(`Remove ${project.client || "this project"} from the draft?`)
  )
    return
  state.content.media.works = state.content.media.works.filter(
    (item) => item.id !== project.id,
  )
  state.content.media.carousels.desktop =
    state.content.media.carousels.desktop.filter(
      (item) => item.projectId !== project.id,
    )
  state.content.media.carousels.mobile =
    state.content.media.carousels.mobile.filter(
      (item) => item.projectId !== project.id,
    )
  state.content.media.carouselOrder = (
    state.content.media.carouselOrder || []
  ).filter((id) => id !== project.id)
  if (state.content.media.carouselSettings)
    delete state.content.media.carouselSettings[project.id]
  state.selectedProjectId = state.content.media.works[0]?.id || null
  markDirty()
  render()
}

async function preview() {
  await saveDraft()
  try {
    const result = await api("/api/preview", { method: "POST", body: "{}" })
    window.open(result.url, "_blank", "noopener")
  } catch (error) {
    notify(error.message, true)
  }
}

async function publish() {
  await saveDraft()
  if (!confirm("Publish this draft to the live TAGG site?")) return
  try {
    const result = await api("/api/publish", { method: "POST", body: "{}" })
    state.publishedRevisionId = result.revisionId
    notify(
      result.propagation === "complete"
        ? "Published. The live site is refreshing now."
        : `Published; refresh is retrying: ${result.propagation}`,
    )
    await load(false)
  } catch (error) {
    notify(error.message, true)
  }
}

async function restore(id) {
  if (
    !confirm(
      "Restore this version into your draft? Nothing goes live until you publish.",
    )
  )
    return
  try {
    await api(`/api/revisions/${id}/restore`, { method: "POST", body: "{}" })
    state.drawer = false
    await load(false)
    notify("Version restored to draft.")
  } catch (error) {
    notify(error.message, true)
  }
}

function uploadFingerprint(file, projectId, role) {
  return `tagg-upload-v2:${projectId}:${role}:${file.name}:${file.size}:${file.lastModified}`
}

function xhrPut(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.upload.onprogress = (event) =>
      event.lengthComputable && onProgress(event.loaded / event.total)
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.getResponseHeader("etag"))
        : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error("Upload connection failed."))
    xhr.send(blob)
  })
}

async function uploadFile(file, projectId, role) {
  const fingerprint = uploadFingerprint(file, projectId, role)
  let session = JSON.parse(localStorage.getItem(fingerprint) || "null")
  try {
    if (!session) {
      session = await api("/api/uploads/start", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          role,
          fileName: file.name,
          type: file.type,
          size: file.size,
        }),
      })
      session.parts = []
      localStorage.setItem(fingerprint, JSON.stringify(session))
      state.jobs.unshift({
        id: session.jobId,
        project_id: projectId,
        asset_role: role,
        original_name: file.name,
        status: "uploading",
        progress: 0,
      })
    }
    const totalParts = Math.ceil(file.size / session.partSize)
    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      if (session.parts.some((part) => part.partNumber === partNumber)) continue
      const signed = await api("/api/uploads/part", {
        method: "POST",
        body: JSON.stringify({
          uploadId: session.uploadId,
          key: session.key,
          partNumber,
        }),
      })
      const start = (partNumber - 1) * session.partSize
      const blob = file.slice(
        start,
        Math.min(start + session.partSize, file.size),
      )
      const etag = await xhrPut(signed.url, blob, (fraction) => {
        const job = state.jobs.find((item) => item.id === session.jobId)
        if (job)
          job.progress = Math.round(
            ((partNumber - 1 + fraction) / totalParts) * 100,
          )
        const bar = document.querySelector(
          `[data-drop="${CSS.escape(`${projectId}:${role}`)}"] .progress span`,
        )
        if (bar && job) bar.style.width = `${job.progress}%`
      })
      if (!etag)
        throw new Error(
          "R2 did not return an upload checksum. Check the bucket CORS ETag exposure.",
        )
      session.parts.push({ partNumber, etag })
      localStorage.setItem(fingerprint, JSON.stringify(session))
    }
    const complete = await api("/api/uploads/complete", {
      method: "POST",
      body: JSON.stringify(session),
    })
    localStorage.removeItem(fingerprint)
    const job = state.jobs.find((item) => item.id === session.jobId)
    if (job)
      Object.assign(job, {
        status: complete.status,
        progress: complete.status === "ready" ? 100 : 0,
      })
    notify(
      complete.status === "ready"
        ? "Image uploaded and ready."
        : "Upload complete. The TAGG Mac will process it next.",
    )
    await load(false)
  } catch (error) {
    const job = state.jobs.find((item) => item.id === session?.jobId)
    if (job) Object.assign(job, { status: "error", error: error.message })
    notify(`${error.message} Choose the same file to resume.`, true)
    render()
  }
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab
      render()
    }),
  )
  document
    .querySelectorAll("[data-path]")
    .forEach((input) =>
      input.addEventListener("input", () =>
        setAtPath(
          input.dataset.path,
          input.type === "checkbox" ? input.checked : input.value,
        ),
      ),
    )
  document
    .querySelectorAll("[data-credits]")
    .forEach((input) =>
      input.addEventListener("input", () =>
        setAtPath(input.dataset.credits, textToCredits(input.value)),
      ),
    )
  document.querySelectorAll("[data-paragraphs]").forEach((input) =>
    input.addEventListener("input", () =>
      setAtPath(
        input.dataset.paragraphs,
        input.value
          .split(/\n\s*\n/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ),
  )
  document.querySelectorAll("[data-lines]").forEach((input) =>
    input.addEventListener("input", () =>
      setAtPath(
        input.dataset.lines,
        input.value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ),
  )
  document.querySelectorAll("[data-carousel-approved]").forEach((input) =>
    input.addEventListener("change", () => {
      const projectId = input.dataset.carouselApproved
      state.content.media.carouselSettings[projectId] ||= {}
      state.content.media.carouselSettings[projectId].approved = input.checked
      markDirty()
    }),
  )
  document
    .querySelectorAll("[data-carousel-add]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        addCarouselProject(button.dataset.carouselAdd),
      ),
    )
  document
    .querySelectorAll("[data-carousel-remove]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        removeCarouselProject(button.dataset.carouselRemove),
      ),
    )
  document
    .querySelectorAll("[data-use-generated]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        useGeneratedCarousel(button.dataset.useGenerated),
      ),
    )
  document
    .querySelectorAll("[data-generate-existing]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        generateDesktopFromMaster(button.dataset.generateExisting),
      ),
    )
  document.querySelectorAll("[data-carousel-move]").forEach((button) =>
    button.addEventListener("click", () => {
      const [index, direction] = button.dataset.carouselMove
        .split(":")
        .map(Number)
      moveCarouselProject(index, direction)
    }),
  )
  document.querySelectorAll("[data-carousel-item]").forEach((card) => {
    card.addEventListener("dragstart", () => card.classList.add("dragging"))
    card.addEventListener("dragend", () => card.classList.remove("dragging"))
    card.addEventListener("dragover", (event) => event.preventDefault())
    card.addEventListener("drop", (event) => {
      event.preventDefault()
      const from = Number(
        document.querySelector(".carousel-card.dragging")?.dataset
          .carouselIndex,
      )
      const to = Number(card.dataset.carouselIndex)
      if (Number.isFinite(from) && Number.isFinite(to) && from !== to)
        moveCarouselProject(from, to - from)
    })
  })
  document.querySelectorAll("[data-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!event.target.closest("[data-move]")) {
        state.selectedProjectId = button.dataset.project
        render()
      }
    })
    button.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault()
        state.selectedProjectId = button.dataset.project
        render()
      }
    })
    button.addEventListener("dragstart", () => button.classList.add("dragging"))
    button.addEventListener("dragend", () =>
      button.classList.remove("dragging"),
    )
    button.addEventListener("dragover", (event) => event.preventDefault())
    button.addEventListener("drop", (event) => {
      event.preventDefault()
      const from = Number(
        document.querySelector(".project-item.dragging")?.dataset.index,
      )
      const to = Number(button.dataset.index)
      if (Number.isFinite(from) && Number.isFinite(to) && from !== to)
        moveProject(from, to - from)
    })
  })
  document.querySelectorAll("[data-move]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.stopPropagation()
      const [index, direction] = button.dataset.move.split(":").map(Number)
      moveProject(index, direction)
    }),
  )
  document.querySelectorAll("[data-upload]").forEach((input) =>
    input.addEventListener("change", () => {
      const [projectId, role] = input.dataset.upload.split(":")
      if (input.files[0]) uploadFile(input.files[0], projectId, role)
    }),
  )
  document.querySelectorAll("[data-drop]").forEach((drop) => {
    drop.addEventListener("dragover", (event) => {
      event.preventDefault()
      drop.classList.add("over")
    })
    drop.addEventListener("dragleave", () => drop.classList.remove("over"))
    drop.addEventListener("drop", (event) => {
      event.preventDefault()
      drop.classList.remove("over")
      const [projectId, role] = drop.dataset.drop.split(":")
      if (event.dataTransfer.files[0])
        uploadFile(event.dataTransfer.files[0], projectId, role)
    })
  })
  document
    .querySelectorAll("[data-restore]")
    .forEach((button) =>
      button.addEventListener("click", () => restore(button.dataset.restore)),
    )
  document.querySelectorAll("[data-add-person]").forEach((button) =>
    button.addEventListener("click", () => {
      const group = button.dataset.addPerson
      state.content.editorial.people[group].push({
        id: `person-${Date.now().toString(36)}`,
        given: "NEW",
        sur: "PERSON",
        role: "",
        bio: "",
        head: "",
        mask: "",
      })
      markDirty()
      render()
    }),
  )
  document.querySelectorAll("[data-remove-person]").forEach((button) =>
    button.addEventListener("click", () => {
      const [group, rawIndex] = button.dataset.removePerson.split(":")
      const person = state.content.editorial.people[group][Number(rawIndex)]
      if (!confirm(`Remove ${person.given} ${person.sur} from the draft?`))
        return
      state.content.editorial.people[group].splice(Number(rawIndex), 1)
      markDirty()
      render()
    }),
  )
  document.querySelectorAll("[data-retry-job]").forEach((button) =>
    button.addEventListener("click", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      try {
        await api(`/api/jobs/${button.dataset.retryJob}/retry`, {
          method: "POST",
          body: "{}",
        })
        notify("Processing queued again.")
        await load(false)
      } catch (error) {
        notify(error.message, true)
      }
    }),
  )
  document.querySelectorAll("[data-action]").forEach((button) =>
    button.addEventListener("click", () => {
      const actions = {
        "add-project": addProject,
        "delete-project": deleteProject,
        preview,
        publish,
        history: () => {
          state.drawer = true
          render()
        },
        "close-drawer": () => {
          state.drawer = false
          render()
        },
      }
      actions[button.dataset.action]?.()
    }),
  )
}

async function load(first = true) {
  try {
    const data = await api("/api/bootstrap")
    state.content = data.draft
    normalizeCarouselContent()
    state.jobs = data.jobs
    state.revisions = data.revisions
    state.user = data.user
    state.savedAt = data.draftMeta.updatedAt
    state.publishedRevisionId = data.publishedRevisionId
    state.selectedProjectId ||= data.draft.media.works[0]?.id
    state.dirty = false
    render()
  } catch (error) {
    app.innerHTML = `<div class="boot"><span class="mark">!</span><h1>Content room unavailable</h1><p>${escapeHtml(error.message)}</p><button class="button" onclick="location.reload()">Try again</button></div>`
  }
}

load()
setInterval(() => {
  const editing = document.activeElement?.matches?.("input, textarea, select")
  if (!state.dirty && !state.saving && !editing) load(false)
}, 15_000)
