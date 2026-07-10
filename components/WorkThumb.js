import styled from "styled-components"
import Image from "next/image"
import InstantVideoPreview from "./InstantVideoPreview"

// Optimized lazy-loading approach
const StyledImage = styled(Image)`
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
`

const Frame = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
`

const WorkThumb = ({ poster, preview, alt, priority = false }) => {
  const imageSrc = poster?.src
  const width = poster?.width || 960
  const height = poster?.height || 540

  if (preview) {
    return (
      <InstantVideoPreview
        staticImageSrc={imageSrc}
        videoSources={preview}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
      />
    )
  }

  // Fallback to static image if no video available
  return (
    <Frame>
      <StyledImage
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        quality={75}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </Frame>
  )
}

export default WorkThumb
