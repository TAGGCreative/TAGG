import { Carousel } from "react-responsive-carousel"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import styled from "styled-components"
import { forwardRef, useState } from "react"
import { useMediaQuery } from "../../utils/useMediaQuery"
import { Overlay } from "../elements/Controls"
import { Slide } from "../elements/Slide"
import { Controls } from "../elements/Controls"
import { MediaPlayer } from "../elements/MediaPlayer"

const Section = styled.section`
  width: 100%;
  height: 100vh;
  height: 100svh;
  padding: 10em 2% 2% 2%;
  box-sizing: border-box;

  @media screen and (max-width: 425px) {
    padding: 4em 2% 2% 2%;
    height: auto;
    min-height: 100svh;
  }
`

const Frame = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: clamp(8px, 0.8vw, 16px);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--black);
  border: 10px solid var(--red);

  @media screen and (max-width: 425px) {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    padding: 6px;
    border-width: 6px;
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
      transform: translate3d(0, calc(100dvh - 12em), 0);
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

const Static = styled.img`
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $opacity }) => $opacity};
  transition: none; /* Instant cut, no fade */
  pointer-events: none;
  z-index: 2;
`

const ClipCarousel = forwardRef(
  ({ clipsDesktop, clipsMobile, cloudflareCustomerCode }, ref) => {
    const [staticOpacity, setStaticOpacity] = useState(0)
    const [current, setCurrent] = useState(0)

    const isMobile = useMediaQuery({ query: "(max-width: 425px)" })
    const selectedClips = isMobile ? clipsMobile : clipsDesktop
    const viewportResolved = typeof isMobile === "boolean"

    const next = () => {
      const next = current + 1 > selectedClips.length - 1 ? 0 : current + 1
      setCurrent(next)
      setStaticOpacity(0.6)
    }

    const prev = () => {
      const prev = current - 1 < 0 ? selectedClips.length - 1 : current - 1
      setCurrent(prev)
      setStaticOpacity(0.6)
    }

    // Hide static overlay immediately when video starts - no fade
    const handlePlayerReady = () => {
      if (
        ["cloudflare", "hls"].includes(selectedClips[current]?.source?.provider)
      ) {
        setStaticOpacity(0)
      }
    }

    const handlePlayerStart = () => {
      setStaticOpacity(0) // Immediately cut out static when video starts
    }

    return (
      <Section ref={ref}>
        <Frame>
          {/* static blip between video loads */}
          <Static src="/images/static.gif" alt="" $opacity={staticOpacity} />

          {/* player stays loaded, loads new url */}
          <EmbedContainer>
            {viewportResolved && (
              <MediaPlayer
                key={
                  selectedClips[current]?.source?.url ||
                  selectedClips[current]?.source?.id
                }
                source={selectedClips[current]?.source}
                customerCode={cloudflareCustomerCode}
                title={`${selectedClips[current]?.client} — ${selectedClips[current]?.title}`}
                width="100%"
                height="100%"
                autoplay
                muted
                loop
                poster={selectedClips[current]?.poster?.src}
                controls={false}
                onReady={handlePlayerReady}
                onPlay={handlePlayerStart}
              />
            )}
          </EmbedContainer>

          {/* external controls overlay for carousel */}
          <Controls
            prev={prev}
            next={next}
            selected={current}
            selectedClips={selectedClips}
          />

          {/* carousel changes title/watch button */}
          <Overlay style={{ width: "50%" }}>
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
          </Overlay>
        </Frame>
      </Section>
    )
  },
)

ClipCarousel.displayName = "ClipCarousel"

export default ClipCarousel
