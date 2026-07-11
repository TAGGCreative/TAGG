import { useState, useRef, useEffect, useCallback } from "react"
import styled from "styled-components"
import Image from "next/image"

const Frame = styled.div`
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: ${({ $width, $height }) => `${$width} / ${$height}`};
  background-color: rgba(0, 0, 0, 0);
  border-radius: 5px;
  overflow: hidden;
  contain: paint;
  isolation: isolate;

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

  /* Grid overlay for all thumbnails */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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

const VideoPreview = styled.video`
  position: absolute;
  inset: 0;
  border-radius: 5px;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
`

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
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const videoRef = useRef(null)
  const hoverRef = useRef(false)

  const preparePreview = useCallback(() => {
    const video = videoRef.current
    if (!video || !hoverRef.current || video.readyState < 2) return

    video.play().catch(() => {})
    const reveal = () => {
      if (hoverRef.current && videoRef.current === video)
        setIsVideoReady(true)
    }
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(reveal)
    } else {
      reveal()
    }
  }, [])

  useEffect(() => {
    if (isHovered && shouldLoad) preparePreview()
  }, [isHovered, preparePreview, shouldLoad])

  const handleMouseEnter = () => {
    hoverRef.current = true
    setShouldLoad(true)
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverRef.current = false
    setIsHovered(false)

    // Pause video
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  return (
    <Frame
      $width={width}
      $height={height}
      $isHovered={isHovered}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      {...props}
    >
      {/* Static thumbnail image - always visible */}
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

      {/* Pre-converted video preview - instant playback! */}
      {videoSources && (
        <VideoPreview
          ref={videoRef}
          poster={staticImageSrc}
          muted
          loop
          playsInline
          preload={shouldLoad ? "auto" : "none"}
          onLoadedData={preparePreview}
          onCanPlay={preparePreview}
          onError={() => setIsVideoReady(false)}
        >
          {/* Prefer H.264 for reliable hardware decoding on desktop/mobile. */}
          <source src={videoSources.mp4} type="video/mp4" />
          <source src={videoSources.webm} type="video/webm" />
        </VideoPreview>
      )}
    </Frame>
  )
}

export default InstantVideoPreview
