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

const getBestAnimatedThumb = (thumb) => {
  if (!thumb) return null

  const sizes = thumb?.sizes ?? []

  if (sizes.length) {
    const sortedByWidth = [...sizes].sort((a, b) => (a.width || 0) - (b.width || 0))
    const largestWithLink = [...sortedByWidth].reverse().find((size) => size?.link)

    if (largestWithLink?.link) {
      return largestWithLink.link
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
        <Gif src={desktopSizeGif} alt={imageSrc || "Work thumbnail"} className="gif" />
      )}
      {imageSrc && <Image src={imageSrc} className="image" />}
    </Frame>
  )
}

export default WorkThumb
