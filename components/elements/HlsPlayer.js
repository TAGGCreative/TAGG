import { useEffect, useRef } from "react"

export default function HlsPlayer({
  url,
  title,
  controls,
  autoplay,
  muted,
  loop,
  onReady,
  onPlay,
  style,
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return undefined
    let hls
    let cancelled = false

    const attach = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url
        onReady?.()
        return
      }

      const { default: Hls } = await import("hls.js")
      if (cancelled || !Hls.isSupported()) return
      hls = new Hls({ enableWorker: true })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => onReady?.())
    }

    attach()
    return () => {
      cancelled = true
      hls?.destroy()
      video.removeAttribute("src")
      video.load()
    }
  }, [url, onReady])

  return (
    <video
      ref={videoRef}
      title={title}
      controls={controls}
      autoPlay={autoplay}
      muted={muted}
      loop={loop}
      playsInline
      preload={autoplay ? "auto" : "metadata"}
      onPlay={onPlay}
      style={{ width: "100%", height: "100%", objectFit: "contain", ...style }}
    />
  )
}
