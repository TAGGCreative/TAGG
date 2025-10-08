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

const WorkThumb = ({ images, thumb }) => {
  const imageSizes = Array.isArray(images) ? images : []
  const lastImageSize = imageSizes[imageSizes.length - 1]?.link
  const fallbackImageSize = imageSizes[0]?.link

  const imageSrc = lastImageSize ?? fallbackImageSize ?? thumb?.link ?? null
  const altText = thumb?.alt ?? "Work thumbnail"

  const thumbSizes = Array.isArray(thumb?.sizes) ? thumb.sizes : []
  const rawDesktopGif =
    thumbSizes[thumbSizes.length - 1]?.link ?? thumb?.link ?? null
  const desktopSizeGif = rawDesktopGif && rawDesktopGif !== imageSrc ? rawDesktopGif : null

  return (
    <Frame>
      {desktopSizeGif ? (
        <>
          <Gif src={desktopSizeGif} alt={altText} className="gif" />
          <Image src={imageSrc} alt={altText} className="image" />
        </>
      ) : (
        <Image src={imageSrc} alt={altText} />
      )}
    </Frame>
  )
}

export default WorkThumb
