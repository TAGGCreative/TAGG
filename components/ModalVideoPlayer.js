import { useEffect, useRef, useState } from "react"
import styles from "../styles/ModalVideoPlayer.module.css"

export default function ModalVideoPlayer({ source, poster, title, onPlaying }) {
  const rootRef = useRef(null)
  const videoRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const startedRef = useRef(false)
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || source?.provider !== "hls" || !source.url) return undefined

    let hls
    let cancelled = false

    const startPlayback = async () => {
      if (cancelled || startedRef.current) return

      try {
        await video.play()
      } catch {
        video.muted = true
        setMuted(true)
        try {
          await video.play()
        } catch {
          setPaused(true)
        }
      }
    }

    const attach = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url
        video.load()
        return
      }

      const { default: Hls } = await import("hls.js")
      if (cancelled || !Hls.isSupported()) return

      hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        backBufferLength: 30,
        startFragPrefetch: true,
      })
      hls.loadSource(source.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, startPlayback)
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
          hls.recoverMediaError()
      })
    }

    video.addEventListener("canplay", startPlayback)
    attach()

    return () => {
      cancelled = true
      window.clearTimeout(feedbackTimerRef.current)
      video.removeEventListener("canplay", startPlayback)
      hls?.destroy()
      video.removeAttribute("src")
      video.load()
    }
  }, [source])

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === rootRef.current)
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const showFeedback = (type) => {
    window.clearTimeout(feedbackTimerRef.current)
    setFeedback(type)
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 700)
  }

  const togglePlayback = async () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      try {
        await video.play()
        setPaused(false)
        showFeedback("play")
      } catch {
        return
      }
    } else {
      video.pause()
      setPaused(true)
      showFeedback("pause")
    }
  }

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const toggleFullscreen = async () => {
    if (!rootRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await rootRef.current.requestFullscreen()
  }

  return (
    <div className={styles.player} ref={rootRef}>
      <video
        ref={videoRef}
        className={styles.video}
        title={title}
        poster={poster}
        playsInline
        preload="auto"
        onPlaying={() => {
          startedRef.current = true
          setPaused(false)
          onPlaying?.()
        }}
        onPause={() => setPaused(true)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      />

      <div
        className={styles.videoSurface}
        role="button"
        tabIndex={0}
        aria-label={paused ? "Play video" : "Pause video"}
        onClick={togglePlayback}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            togglePlayback()
          }
        }}
      />

      <div
        className={`${styles.centerFeedback} ${feedback ? styles.feedbackVisible : ""} ${paused ? styles.isPaused : ""}`}
        aria-hidden="true"
      >
        {feedback === "play" && !paused ? (
          <span className={styles.playGlyph} />
        ) : (
          <span className={styles.pauseGlyph}>
            <i />
            <i />
          </span>
        )}
      </div>

      <div className={styles.controlBar}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={toggleSound}
          aria-label={muted ? "Turn sound on" : "Mute video"}
        >
          <span
            className={`${styles.soundGlyph} ${muted ? styles.soundMuted : ""}`}
          />
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <span
            className={`${styles.fullscreenGlyph} ${fullscreen ? styles.fullscreenActive : ""}`}
          />
        </button>
      </div>
    </div>
  )
}
