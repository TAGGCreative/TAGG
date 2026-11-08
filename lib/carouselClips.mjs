export function mobileCarouselClips(clipsDesktop = [], clipsMobile = []) {
  const byProject = new Map(
    clipsMobile.map((clip) => [String(clip.projectId), clip]),
  )

  return clipsDesktop.map((desktopClip) => {
    const mobileClip = byProject.get(String(desktopClip.projectId))
    if (!mobileClip?.source) {
      return {
        ...desktopClip,
        id: `${desktopClip.id}-mobile-crop`,
        mobileCropFallback: true,
      }
    }

    return {
      ...desktopClip,
      ...mobileClip,
      poster: mobileClip.poster || desktopClip.poster,
    }
  })
}
