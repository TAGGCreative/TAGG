import { useEffect, useMemo, useState } from "react"
import styled from "styled-components"

const Image = styled.img`
  width: 100%;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
`

const Gif = styled.img`
  position: absolute;
  width: 100%;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
  outline: ${({ $hasAnimated }) =>
    $hasAnimated ? "1px solid var(--red)" : "none"};
  opacity: 0;
`

const Frame = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
  width: 100%;
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
    <Frame>
      <Gif
        src={hoverSrc}
        alt=""
        aria-hidden="true"
        className="gif"
        $hasAnimated={hasAnimated}
      />
      <Image src={staticImageSrc} alt="" className="image" />
    </Frame>
  )
}

export default WorkThumb
