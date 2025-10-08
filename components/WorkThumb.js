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

  const coerceToArray = (maybeArrayLike) => {
    if (!maybeArrayLike) return []
    if (Array.isArray(maybeArrayLike)) return maybeArrayLike

    return Object.values(maybeArrayLike)
  }

  const directSizes = coerceToArray(thumb?.sizes)
  if (directSizes.length) {
    return directSizes
  }

  const pictureSizes = coerceToArray(thumb?.pictures?.sizes)
  if (pictureSizes.length) {
    return pictureSizes
  }

  const fileSizes = coerceToArray(thumb?.files)
  if (fileSizes.length) {
    return fileSizes
  }

  return []
}

const getBestAnimatedThumb = (thumb) => {
  if (!thumb) return null

  const sizes = normaliseThumbSizes(thumb)

  const getSizeLink = (size) => size?.link || size?.link_with_play_button

  if (sizes.length) {
    const preferredWidths = [640, 720, 540]
    for (const width of preferredWidths) {
      const match = sizes.find(
        (size) => Number(size?.width) === width && getSizeLink(size),
      )
      const matchLink = getSizeLink(match)
      if (matchLink) {
        return matchLink
      }
    }

    const fallbackByIndex = getSizeLink(sizes[2])
    if (fallbackByIndex) {
      return fallbackByIndex
    }

    const sortedByWidth = [...sizes]
      .filter((size) => getSizeLink(size))
      .sort((a, b) => Number(b?.width || 0) - Number(a?.width || 0))

    if (sortedByWidth.length) {
      return getSizeLink(sortedByWidth[0])
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
