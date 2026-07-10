import catalog from "../content/media-catalog.json"

export function getMediaCatalog() {
  return catalog
}

export function getWorks() {
  return catalog.works || []
}

export function getWork(videoId) {
  return getWorks().find((work) => work.id === String(videoId)) || null
}

export function getCarouselClips(format) {
  return catalog.carousels?.[format] || []
}

export function getCloudflareCustomerCode() {
  return catalog.cloudflare?.customerCode || ""
}
