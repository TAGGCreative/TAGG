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
  outline: 1px solid var(--red);
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

const normaliseThumbSizes = (thumb) => {
  if (!thumb) return []

  if (Array.isArray(thumb)) {
    return thumb
  }

  if (Array.isArray(thumb?.sizes)) {
    return thumb.sizes
  }

  if (Array.isArray(thumb?.pictures?.sizes)) {
    return thumb.pictures.sizes
  }

  return []
}

const getBestAnimatedThumb = (thumb) => {
  if (!thumb) return null

  const sizes = normaliseThumbSizes(thumb)

  if (sizes.length) {
    const preferredWidths = [640, 720, 540]
    for (const width of preferredWidths) {
      const match = sizes.find((size) => size?.width === width && size?.link)
      if (match?.link) {
        return match.link
      }
    }

    const fallbackByIndex = sizes[2]?.link
    if (fallbackByIndex) {
      return fallbackByIndex
    }

    const sortedByWidth = [...sizes]
      .filter((size) => size?.link)
      .sort((a, b) => (b.width || 0) - (a.width || 0))

    if (sortedByWidth.length) {
      return sortedByWidth[0].link
    }
  }

  return thumb?.link ?? null
}

const getLargestImage = (images) => {
  if (!images?.length) return null

  const sortedByWidth = [...images].sort((a, b) => (a.width || 0) - (b.width || 0))
  const largestWithLink = [...sortedByWidth].reverse().find((size) => size?.link)

  return largestWithLink?.link ?? sortedByWidth.pop()?.link ?? null
}

const WorkThumb = ({ images, thumb }) => {
  const imageSrc = getLargestImage(images)
  const desktopSizeGif = getBestAnimatedThumb(thumb)

  return (
    <Frame>
      {desktopSizeGif && (
        <Gif src={desktopSizeGif} alt="Animated work preview" className="gif" />
      )}
      {imageSrc && <Image src={imageSrc} className="image" />}
    </Frame>
  )
}

export default WorkThumb
