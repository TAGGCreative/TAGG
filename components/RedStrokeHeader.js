import { useRef, useEffect } from "react"
import styled from "styled-components"

const H1 = styled.h1`
  /* fixed */
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px var(--red);
  background-color: transparent;
  font-family: Montserrat-Bold;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: center;

  /* layout */
  margin: 0;
  padding: 0;
  width: 100%;
  user-select: none;
  z-index: 0;
  font-size: 10em;

  @media screen and (max-width: 425px) {
    font-size: 3em;
    margin-bottom: 10%;
  }
`

export default H1
