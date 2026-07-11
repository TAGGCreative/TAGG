import { useEffect, useRef } from "react"

export default function HlsPlayer({
  url,
  title,
  controls,
  autoplay,
  muted,
  loop,
  poster,
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
        return
      }

      const { default: Hls } = await import("hls.js")
      if (cancelled || !Hls.isSupported()) return
      hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        startLevel: 0,
        abrEwmaDefaultEstimate: 1600000,
        maxBufferLength: 30,
        backBufferLength: 30,
      })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError()
        } else {
          hls.destroy()
        }
      })
    }

    attach()
    return () => {
      cancelled = true
      hls?.destroy()
      video.removeAttribute("src")
      video.load()
    }
  }, [url])

  return (
    <video
      ref={videoRef}
      title={title}
      controls={controls}
      autoPlay={autoplay}
      muted={muted}
      loop={loop}
      poster={poster}
      playsInline
      preload={autoplay ? "auto" : "metadata"}
      onCanPlay={onReady}
      onPlay={onPlay}
      onPlaying={onPlay}
      style={{ width: "100%", height: "100%", objectFit: "contain", ...style }}
    />
  )
}
