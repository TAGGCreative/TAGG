import { Carousel } from "react-responsive-carousel"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import VimeoPlayer from "react-player/vimeo"
import styled from "styled-components"
import { forwardRef, useEffect, useState } from "react"
import { useMediaQuery } from "react-responsive"
import { Overlay } from "../elements/Controls"
import { Slide } from "../elements/Slide"
import { Controls } from "../elements/Controls"

const Section = styled.section`
  width: 100vw;
  height: 100vh;
  padding: 10em 2% 2% 2%;

  @media screen and (max-width: 425px) {
    padding: 4em 2% 2% 2%;
  }
`

const Frame = styled.div`
  width: 100%;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  @media screen and (max-width: 425px) {
    height: 90%;
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
      transform: translate3d(0, 200000%, 0);
    }
  }

  @keyframes scanlines {
    0% {
      background-position: 0 50%;
    }
  }

  /* frame */
  border: 10px solid var(--red);
`

const EmbedContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%;
  width: 100%;
  height: 100%;
  overflow: hidden;

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
  opacity: ${({ opacity }) => opacity};
  transition: opacity 300ms ease-in;
`

const ClipCarousel = forwardRef(({ clipsDesktop, clipsMobile }, ref) => {
  const [staticOpacity, setStaticOpacity] = useState(0.6)
  const [current, setCurrent] = useState(0)

  const isMobile = useMediaQuery({ query: "(max-width: 425px)" })
  const selectedClips = isMobile ? clipsMobile : clipsDesktop

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

  const url = `https://player.vimeo.com/video/${
    selectedClips[current]?.uri?.split("/")[2]
  }`

  return (
    <Section ref={ref}>
      <Frame>
        {/* static blip between video loads */}
        <Static src="/images/static.gif" opacity={staticOpacity} />

        {/* player stays loaded, loads new url */}
        <EmbedContainer>
          <VimeoPlayer
            height="100%"
            width="100%"
            url={url}
            // static be gone
            onPlay={() => setStaticOpacity(0)}
            config={{
              vimeo: {
                playerOptions: {
                  autoplay: true,
                  muted: true,
                  controls: false,
                  playsinline: true,
                  keyboard: false,
                  loop: true,
                  portrait: false,
                },
              },
            }}
          />
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
            {selectedClips.map((video, i) => {
              try {
                // get the matching featured-work id (separate video)
                const { id, client, title } = JSON.parse(video.description)
                const path = `/works/${id}`

                return (
                  <Slide client={client} title={title} href={path} key={i} />
                )
              } catch (error) {
                console.log("CAROUSEL Problem with video named: ", video.name)
                console.error(error)
                return null
              }
            })}
          </Carousel>
        </Overlay>
      </Frame>
    </Section>
  )
})

export default ClipCarousel
