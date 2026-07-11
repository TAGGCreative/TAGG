import { useEffect, useState } from "react"
import styled from "styled-components"

const H1 = styled.h1`
  background-color: transparent;
  font-family: Montserrat-Bold, "Arial Black", Arial, sans-serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0;
  opacity: ${({ $fontReady, inView }) =>
    $fontReady ? (inView ? ".1" : "1") : "0"};
  padding: 0;
  position: absolute;
  text-transform: uppercase;
  text-align: center;
  user-select: none;
  z-index: 1;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px var(--white);
  transition: opacity 1200ms ease-in 100ms;
  overflow: hidden;
  font-size: 30svh;
  @media screen and (max-width: 425px) {
    font-size: 15svh;
  }
`

export default function WhiteStrokeHeader({ children, style, inView }) {
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let active = true
    const reveal = () => {
      if (active) setFontReady(true)
    }

    if (!document.fonts?.load) {
      reveal()
      return () => {
        active = false
      }
    }

    document.fonts.load("700 1em Montserrat-Bold").then(reveal, reveal)
    return () => {
      active = false
    }
  }, [])

  return (
    <H1 style={style} inView={inView} $fontReady={fontReady}>
      {children}
    </H1>
  )
}
