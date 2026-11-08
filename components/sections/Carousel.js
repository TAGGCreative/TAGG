import { Carousel } from "react-responsive-carousel"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import styled from "styled-components"
import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import { useMediaQuery } from "../../utils/useMediaQuery"
import { Overlay } from "../elements/Controls"
import { Slide } from "../elements/Slide"
import { Controls } from "../elements/Controls"
import { MediaPlayer } from "../elements/MediaPlayer"
import { mobileCarouselClips } from "../../lib/carouselClips.mjs"

const Section = styled.section`
  width: 100%;
  height: 100vh;
  height: 100svh;
  padding: 10em 2% 2% 2%;
  box-sizing: border-box;
  container-type: size;
  display: grid;
  place-items: center;

  @media screen and (max-width: 600px) {
    padding: 5rem 1rem 2rem;
    height: auto;
    min-height: 100svh;
  }
`

const Frame = styled.div`
  width: min(100cqw, 177.7778cqh);
  height: auto;
  aspect-ratio: 16 / 9;
  min-height: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--black);
  outline: 10px solid var(--red);
  outline-offset: 0;

  @media screen and (max-width: 600px) {
    width: auto;
    max-width: calc(100vw - 2rem);
    height: min(82svh, calc((100vw - 2rem) * 1.7778));
    aspect-ratio: 9 / 16;
    outline-width: 6px;
  }

  .carousel-root a {
    z-index: 11;
  }
  .carousel-root,
  .carousel,
  .slide,
  .slider-wrapper,
  .slider {
    width: 100%;
    height: 100%;
  }

  &::before,
  &::after {
    display: block;
    pointer-events: none;
    content: "";
    position: absolute;
  }

  // unique scanline
  &::before {
    top: 0;
    width: 100%;
    height: 2px;
    z-index: 1;
    background: #1e1e1ead;
    opacity: 0.75;
    animation: scanline 6s linear infinite;
  }

  // scanlines
  &::after {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    background: linear-gradient(to bottom, transparent 50%, #1e1e1e4d 51%);
    background-size: 100% 5px;
    animation: scanlines 1s steps(30) infinite;
  }

  @keyframes scanline {
    0% {
      transform: translate3d(0, -2px, 0);
    }
    100% {
      transform: translate3d(0, 100cqh, 0);
    }
  }

  @keyframes scanlines {
    0% {
      background-position: 0 50%;
    }
  }
`

const EmbedContainer = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--black);

  & iframe,
  & object,
  & embed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`

const PosterFrame = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background-color: var(--black);
  background-image: ${({ $src }) =>
    $src ? `url("${String($src).replaceAll('"', "%22")}")` : "none"};
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 160ms ease-out;
`

const Static = styled.video`
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transition: none; /* Instant cut, no fade */
  pointer-events: none;
  z-index: 3;
`

const DetailsOverlay = styled(Overlay)`
  width: 50%;

  @media screen and (max-width: 600px) {
    width: 100%;
  }
`

const ClipCarousel = forwardRef(
  ({ clipsDesktop, clipsMobile, cloudflareCustomerCode }, ref) => {
    const [isStaticVisible, setIsStaticVisible] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [isPosterVisible, setIsPosterVisible] = useState(true)
    const [current, setCurrent] = useState(0)
    const staticRef = useRef(null)
    const transitionTimerRef = useRef(null)
    const staticFallbackTimerRef = useRef(null)

    const isMobile = useMediaQuery({ query: "(max-width: 600px)" })
    const mobileClips = useMemo(
      () => mobileCarouselClips(clipsDesktop, clipsMobile),
      [clipsDesktop, clipsMobile],
    )
    const selectedClips = isMobile ? mobileClips : clipsDesktop || []
    const viewportResolved = typeof isMobile === "boolean"
    const activeClip = selectedClips[current]

    useEffect(
      () => () => {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
        if (staticFallbackTimerRef.current)
          clearTimeout(staticFallbackTimerRef.current)
      },
      [],
    )

    useEffect(() => {
      if (selectedClips.length === 0 || current >= selectedClips.length)
        setCurrent(0)
    }, [current, selectedClips.length])

    useEffect(() => {
      setIsPosterVisible(true)
    }, [
      activeClip?.poster?.src,
      activeClip?.source?.id,
      activeClip?.source?.url,
    ])

    const transitionTo = (nextIndex) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setIsStaticVisible(true)
      const staticVideo = staticRef.current
      if (staticVideo) {
        staticVideo.currentTime = 0
        staticVideo.play().catch(() => {})
      }
      transitionTimerRef.current = setTimeout(() => {
        setCurrent(nextIndex)
      }, 220)
      staticFallbackTimerRef.current = setTimeout(() => {
        setIsStaticVisible(false)
        setIsTransitioning(false)
        staticRef.current?.pause()
      }, 700)
    }

    const next = () => {
      if (!selectedClips.length) return
      const next = current + 1 > selectedClips.length - 1 ? 0 : current + 1
      transitionTo(next)
    }

    const prev = () => {
      if (!selectedClips.length) return
      const prev = current - 1 < 0 ? selectedClips.length - 1 : current - 1
      transitionTo(prev)
    }

    const handlePlayerStart = () => {
      if (staticFallbackTimerRef.current)
        clearTimeout(staticFallbackTimerRef.current)
      setIsPosterVisible(false)
      setIsStaticVisible(false)
      setIsTransitioning(false)
      staticRef.current?.pause()
    }

    return (
      <Section ref={ref}>
        <Frame>
          {/* static blip between video loads */}
          <Static
            ref={staticRef}
            src="/videos/static-transition.mp4"
            $isVisible={isStaticVisible}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />

          {/* player stays loaded, loads new url */}
          <EmbedContainer>
            {viewportResolved && activeClip && (
              <MediaPlayer
                key={activeClip.source?.url || activeClip.source?.id}
                source={activeClip.source}
                customerCode={cloudflareCustomerCode}
                title={`${activeClip.client} — ${activeClip.title}`}
                width="100%"
                height="100%"
                autoplay
                muted
                loop
                poster={activeClip.poster?.src}
                controls={false}
                style={{ objectFit: "cover" }}
                onPlay={handlePlayerStart}
              />
            )}
            <PosterFrame
              $src={activeClip?.poster?.src}
              $visible={Boolean(activeClip?.poster?.src && isPosterVisible)}
              aria-hidden="true"
            />
          </EmbedContainer>

          {/* external controls overlay for carousel */}
          <Controls
            prev={prev}
            next={next}
            selected={current}
            selectedClips={selectedClips}
            disabled={isTransitioning || selectedClips.length < 2}
          />

          {/* carousel changes title/watch button */}
          <DetailsOverlay>
            <Carousel
              width="100%"
              height="100%"
              infiniteLoop
              // autoPlay ?
              selectedItem={current}
              showIndicators={false}
              showArrows={false}
              showThumbs={false}
              showStatus={false}
              swipeable={false}
              onChange={(index, item) => {
                setCurrent(index)
              }}
            >
              {selectedClips.map((video) => {
                return (
                  <Slide
                    client={video.client}
                    title={video.title}
                    href={`/works/${video.projectId}`}
                    key={video.id}
                  />
                )
              })}
            </Carousel>
          </DetailsOverlay>
        </Frame>
      </Section>
    )
  },
)

ClipCarousel.displayName = "ClipCarousel"

export default ClipCarousel
