import React from "react"
import styled from "styled-components"

const Image = styled.img`
  width: 100%;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
`

const Preview = styled.video`
  position: absolute;
  width: 100%;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
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
  const imageSrc = images[3]?.link
  const previewSrc = thumb?.mp4 || thumb?.gif
  const videoRef = React.useRef(null)

  return (
    <Frame
      onMouseEnter={() => videoRef.current && videoRef.current.play()}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
      }}
    >
      {previewSrc && (
        <Preview
          ref={videoRef}
          src={previewSrc}
          className="preview"
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}
      <Image src={imageSrc} className="image" />
    </Frame>
  )
}

export default WorkThumb
