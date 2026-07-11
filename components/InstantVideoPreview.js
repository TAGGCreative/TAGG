import { useEffect, useRef, useState } from "react"
import styled from "styled-components"
import Image from "next/image"

const Frame = styled.div`
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: ${({ $width, $height }) => `${$width} / ${$height}`};
  background-color: transparent;
  border-radius: 5px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid var(--red);
    border-radius: 5px;
    pointer-events: none;
    z-index: 2;
    opacity: ${({ $isHovered }) => ($isHovered ? 1 : 0)};
    transition: opacity 0.15s ease-in-out;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.1) 2px, transparent 2px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.1) 2px, transparent 2px);
    background-size: 3px 3px;
    border-radius: 5px;
    pointer-events: none;
    z-index: 1;
    opacity: 0.6;
  }
`

const StaticImage = styled(Image)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 5px;
  z-index: 1;
  opacity: ${({ $showPoster }) => ($showPoster ? 1 : 0)};
  transition: ${({ $showPoster }) =>
    $showPoster ? "none" : "opacity 0.35s ease-in-out"};
`

const CanvasPreview = styled.canvas`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 5px;
  pointer-events: none;
`

// A single detached video decodes every preview. Canvas keeps native video
// overlay planes out of the thumbnail grid and its compositor tree.
let sharedVideo = null
let sharedSource = ""
let activeSession = null

const getSharedVideo = () => {
  if (sharedVideo || typeof document === "undefined") return sharedVideo

  sharedVideo = document.createElement("video")
  sharedVideo.muted = true
  sharedVideo.defaultMuted = true
  sharedVideo.loop = true
  sharedVideo.playsInline = true
  sharedVideo.preload = "auto"
  sharedVideo.disablePictureInPicture = true
  sharedVideo.setAttribute("playsinline", "")
  sharedVideo.setAttribute("aria-hidden", "true")
  return sharedVideo
}

const cancelFrame = (session) => {
  if (!session) return

  if (
    session.videoFrameId !== null &&
    typeof session.video.cancelVideoFrameCallback === "function"
  ) {
    session.video.cancelVideoFrameCallback(session.videoFrameId)
  }
  if (session.animationFrameId !== null)
    window.cancelAnimationFrame(session.animationFrameId)

  session.videoFrameId = null
  session.animationFrameId = null
}

const stopPreview = (owner) => {
  if (!activeSession || (owner && activeSession.owner !== owner)) return

  cancelFrame(activeSession)
  activeSession.video.pause()
  activeSession.video.onerror = null
  activeSession = null
}

const drawVideoCover = (context, video, width, height) => {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  if (!sourceWidth || !sourceHeight) return false

  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height
  let sourceX = 0
  let sourceY = 0
  let cropWidth = sourceWidth
  let cropHeight = sourceHeight

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio
    sourceX = (sourceWidth - cropWidth) / 2
  } else if (sourceRatio < targetRatio) {
    cropHeight = sourceWidth / targetRatio
    sourceY = (sourceHeight - cropHeight) / 2
  }

  context.drawImage(
    video,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height,
  )
  return true
}

const scheduleFrame = (session) => {
  if (activeSession !== session) return

  const drawFrame = () => {
    if (activeSession !== session) return

    session.videoFrameId = null
    session.animationFrameId = null

    if (
      session.video.readyState >= 2 &&
      drawVideoCover(
        session.context,
        session.video,
        session.width,
        session.height,
      )
    ) {
      if (!session.hasDrawnFrame) {
        session.hasDrawnFrame = true
        session.onReady()
      }
    }

    scheduleFrame(session)
  }

  if (typeof session.video.requestVideoFrameCallback === "function") {
    session.videoFrameId = session.video.requestVideoFrameCallback(drawFrame)
  } else {
    session.animationFrameId = window.requestAnimationFrame(drawFrame)
  }
}

const playSession = (session) => {
  if (activeSession !== session || session.isScheduled) return
  session.isScheduled = true

  scheduleFrame(session)
  session.video.play().catch(() => {
    if (activeSession !== session) return
    cancelFrame(session)
    session.isScheduled = false
  })
}

const startPreview = ({ owner, canvas, sources, width, height, onReady }) => {
  const video = getSharedVideo()
  if (!video || !canvas) return

  stopPreview()

  const sourceList = [sources?.mp4, sources?.webm].filter(Boolean)
  if (!sourceList.length) return

  const context = canvas.getContext("2d", { alpha: false })
  if (!context) return

  const session = {
    owner,
    video,
    context,
    width,
    height,
    sources: sourceList,
    sourceIndex: 0,
    hasDrawnFrame: false,
    isScheduled: false,
    videoFrameId: null,
    animationFrameId: null,
    onReady,
  }
  activeSession = session

  const loadSource = () => {
    if (activeSession !== session) return

    const source = session.sources[session.sourceIndex]
    if (sharedSource !== source) {
      sharedSource = source
      video.src = source
      video.load()
    } else if (video.ended) {
      video.currentTime = 0
    }

    session.isScheduled = false
    playSession(session)
  }

  video.onerror = () => {
    if (
      activeSession !== session ||
      session.sourceIndex >= session.sources.length - 1
    )
      return

    cancelFrame(session)
    session.sourceIndex += 1
    loadSource()
  }

  loadSource()
}

const InstantVideoPreview = ({
  staticImageSrc,
  videoSources,
  alt = "",
  width = 640,
  height = 360,
  priority = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const canvasRef = useRef(null)
  const ownerRef = useRef({})

  useEffect(() => () => stopPreview(ownerRef.current), [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    setIsVideoReady(false)
    startPreview({
      owner: ownerRef.current,
      canvas: canvasRef.current,
      sources: videoSources,
      width,
      height,
      onReady: () => setIsVideoReady(true),
    })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsVideoReady(false)
    stopPreview(ownerRef.current)
  }

  return (
    <Frame
      $width={width}
      $height={height}
      $isHovered={isHovered}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <CanvasPreview
        ref={canvasRef}
        width={width}
        height={height}
        aria-hidden="true"
      />
      <StaticImage
        src={staticImageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 425px) 95vw, 31.5vw"
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        $showPoster={!isHovered || !isVideoReady}
        quality={75}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </Frame>
  )
}

export default InstantVideoPreview
