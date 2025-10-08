import { useEffect, useMemo, useState } from "react"
import styled from "styled-components"

const Image = styled.img`
  width: 100%;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
`

const Gif = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
  z-index: 2;
  opacity: 0; /* will fade in only if hasAnimated */
`

/* NEW: a dedicated overlay just for outline/hover chrome */
const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  pointer-events: none; /* don't block hover/clicks */
  z-index: 3; /* above images */
  outline: 1px solid transparent;
  transition: outline-color 0.2s ease-in-out;
`

const Frame = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
  width: 100%;
  /* keep title/outline/etc. on hover for ALL cards */
  &:hover .overlay {
    outline-color: var(--red);
  }
  /* only fade the GIF in when this card actually has animation */
  &:hover .gif {
    opacity: ${(props) => (props.$hasAnimated ? 1 : 0)};
  }
`

const getBestStaticImage = (images = []) => {
  if (!images?.length) {
    return ""
  }

  const preferredIndexes = [3, 2, images.length - 1, 0]
  for (const index of preferredIndexes) {
    const candidate = images[index]?.link
    if (candidate) {
      return candidate
    }
  }

  const firstAvailable = images.find(({ link }) => Boolean(link))
  return firstAvailable?.link ?? ""
}

const getAnimatedCandidate = (thumb) => {
  if (!thumb) {
    return null
  }

  if (thumb?.sizes?.length) {
    const { sizes } = thumb
    const preferred = [...sizes].reverse().find(({ link }) => Boolean(link))
    if (preferred?.link) {
      return preferred.link
    }
  }

  return thumb?.link ?? null
}

const WorkThumb = ({ images, thumb }) => {
  const staticImageSrc = useMemo(() => getBestStaticImage(images), [images])
  const animatedCandidate = useMemo(
    () => getAnimatedCandidate(thumb),
    [thumb],
  )

  const [hoverSrc, setHoverSrc] = useState(staticImageSrc)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    setHoverSrc(staticImageSrc)
    setHasAnimated(false)
  }, [staticImageSrc])

  useEffect(() => {
    if (!animatedCandidate || animatedCandidate === staticImageSrc) {
      setHasAnimated(false)
      return
    }

    let isMounted = true
    const preload = new window.Image()

    preload.onload = () => {
      if (!isMounted) return
      setHoverSrc(animatedCandidate)
      setHasAnimated(true)
    }

    preload.onerror = () => {
      if (!isMounted) return
      setHoverSrc(staticImageSrc)
      setHasAnimated(false)
    }

    preload.src = animatedCandidate

    return () => {
      isMounted = false
    }
  }, [animatedCandidate, staticImageSrc])

  return (
    <Frame $hasAnimated={hasAnimated}>
      {/* poster underneath */}
      <Image src={staticImageSrc} alt="" className="image" style={{ zIndex: 1 }} />
      {/* hover animation layer (only shows when hasAnimated) */}
      <Gif
        src={hoverSrc}
        alt=""
        aria-hidden="true"
        className="gif"
        $hasAnimated={hasAnimated}
        style={{ pointerEvents: "none" }}
      />
      {/* always-on hover chrome: outline (and you can add title here too if needed) */}
      <Overlay className="overlay" />
    </Frame>
  )
}

export default WorkThumb
