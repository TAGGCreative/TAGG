import Image from "next/image"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import ModalVideoPlayer from "./ModalVideoPlayer"
import { VideoModalContext } from "./VideoModalContext"
import styles from "../styles/VideoModalPrototype.module.css"

const CLOSE_FALLBACK_DURATION = 800

function getTransform(from, to) {
  return `translate3d(${from.left - to.left}px, ${from.top - to.top}px, 0) scale(${from.width / to.width}, ${from.height / to.height})`
}

export default function VideoModalPrototype({ works = [], children }) {
  const [selection, setSelection] = useState(null)
  const [phase, setPhase] = useState("idle")
  const [showPlayer, setShowPlayer] = useState(false)
  const mediaRef = useRef(null)
  const triggerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const closeProjectRef = useRef(null)
  const closeTransitionCleanupRef = useRef(null)

  const openProject = (work, event) => {
    const trigger = event.currentTarget
    const thumbnail = trigger.querySelector("[data-modal-thumbnail]")
    const thumbnailAnchor = trigger.querySelector(
      "[data-modal-thumbnail-anchor]",
    )
    triggerRef.current = trigger
    setShowPlayer(false)
    setPhase("measuring")
    setSelection({
      work,
      origin: (thumbnail || trigger).getBoundingClientRect(),
      destination: (
        thumbnailAnchor ||
        thumbnail ||
        trigger
      ).getBoundingClientRect(),
    })
  }

  const closeProject = useCallback(() => {
    if (!selection || phase === "closing") return

    const media = mediaRef.current
    const triggerRect = selection.destination || selection.origin

    setShowPlayer(false)
    setPhase("closing")
    document.body.classList.remove("video-modal-open")
    document.body.classList.add("video-modal-closing")

    if (media && triggerRect) {
      const finalRect = media.getBoundingClientRect()
      media.style.transform = getTransform(triggerRect, finalRect)
      media.style.borderRadius = "10px"
    }

    let finished = false
    const finishClose = () => {
      if (finished) return
      finished = true
      window.clearTimeout(closeTimerRef.current)
      closeTransitionCleanupRef.current?.()
      closeTransitionCleanupRef.current = null
      document.body.classList.remove("video-modal-closing")
      setSelection(null)
      setPhase("idle")
      triggerRef.current?.focus({ preventScroll: true })
    }

    if (media) {
      const onTransitionEnd = (event) => {
        if (event.target === media && event.propertyName === "transform") {
          finishClose()
        }
      }
      media.addEventListener("transitionend", onTransitionEnd)
      closeTransitionCleanupRef.current = () => {
        media.removeEventListener("transitionend", onTransitionEnd)
      }
    }

    closeTimerRef.current = window.setTimeout(
      finishClose,
      CLOSE_FALLBACK_DURATION,
    )
  }, [phase, selection])

  useEffect(() => {
    closeProjectRef.current = closeProject
  }, [closeProject])

  useLayoutEffect(() => {
    if (!selection || phase !== "measuring" || !mediaRef.current) return

    const media = mediaRef.current
    const finalRect = media.getBoundingClientRect()
    media.style.transition = "none"
    media.style.transform = getTransform(selection.origin, finalRect)
    media.style.borderRadius = "10px"

    const firstFrame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(() => {
        media.style.transition = ""
        media.style.transform = "translate3d(0, 0, 0) scale(1)"
        media.style.borderRadius = "20px"
        setPhase("open")
      })

      return () => cancelAnimationFrame(secondFrame)
    })

    return () => cancelAnimationFrame(firstFrame)
  }, [phase, selection])

  useEffect(() => {
    if (!selection) return undefined

    document.body.classList.add("video-modal-open")
    document.body.classList.remove("video-modal-closing")

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeProjectRef.current?.()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.classList.remove("video-modal-open")
      document.body.classList.remove("video-modal-closing")
      window.removeEventListener("keydown", onKeyDown)
      window.clearTimeout(closeTimerRef.current)
      closeTransitionCleanupRef.current?.()
      closeTransitionCleanupRef.current = null
    }
  }, [selection])

  return (
    <VideoModalContext.Provider value={openProject}>
      {children || (
        <div
          className={styles.gallery}
          aria-label="Modal interaction prototypes"
        >
          {works.map((work, index) => (
            <button
              className={styles.projectCard}
              type="button"
              key={work.id}
              onClick={(event) => openProject(work, event)}
              aria-haspopup="dialog"
              style={{ "--delay": `${index * 70}ms` }}
            >
              <span
                className={styles.thumbnailAnchor}
                data-modal-thumbnail-anchor
              >
                <span className={styles.thumbnail} data-modal-thumbnail>
                  <Image
                    src={work.poster.src}
                    alt=""
                    width={work.poster.width}
                    height={work.poster.height}
                    priority={index === 0}
                  />
                  <span className={styles.playHint} aria-hidden="true">
                    <span />
                  </span>
                </span>
              </span>
              <span className={styles.cardCopy}>
                <strong>{work.client}</strong>
                <span>{work.title}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selection &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`${styles.modal} ${styles[phase]}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-project-title"
          >
            <button
              className={styles.backdrop}
              type="button"
              onClick={closeProject}
              aria-label="Close project"
            />

            <div className={styles.modalScroll}>
              <article
                className={styles.modalContent}
                style={{
                  "--modal-width": `${Math.round(selection.origin.width * 2.5)}px`,
                }}
              >
                <div className={styles.modalTopline}>
                  <span>TAGG / Film</span>
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={closeProject}
                    autoFocus
                    aria-label="Close project"
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.mediaFrame} ref={mediaRef}>
                  <Image
                    className={`${styles.expandedPoster} ${showPlayer ? styles.posterHidden : ""}`}
                    src={selection.work.poster.src}
                    alt=""
                    fill
                    sizes="(max-width: 620px) calc(100vw - 32px), 1100px"
                    priority
                  />
                  <div className={styles.playerWrap}>
                    <ModalVideoPlayer
                      source={selection.work.source}
                      title={`${selection.work.client} — ${selection.work.title}`}
                      poster={selection.work.poster.src}
                      onPlaying={() => setShowPlayer(true)}
                    />
                  </div>
                </div>

                <div className={styles.details}>
                  <header className={styles.projectHeading}>
                    <h2 id="modal-project-title">{selection.work.client}</h2>
                    <p>{selection.work.title}</p>
                  </header>

                  <dl className={styles.credits}>
                    {Object.entries(selection.work.credits || {}).map(
                      ([role, name], index) =>
                        name ? (
                          <div
                            className={styles.credit}
                            key={role}
                            style={{
                              "--credit-delay": `${340 + index * 60}ms`,
                            }}
                          >
                            <dt>{role}</dt>
                            <dd>{name}</dd>
                          </div>
                        ) : null,
                    )}
                  </dl>
                </div>
              </article>
            </div>
          </div>,
          document.body,
        )}
    </VideoModalContext.Provider>
  )
}
