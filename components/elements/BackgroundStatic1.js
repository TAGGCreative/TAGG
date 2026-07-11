import styled from "styled-components"

const Static = styled.div`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  background-image: url("/images/static.gif");
  background-repeat: repeat;
  background-size: 250px 188px;
  opacity: 0.045;
  pointer-events: none;
  overflow: hidden;
  contain: strict;
`

const BackgroundStatic1 = () => <Static aria-hidden="true" />

export { BackgroundStatic1 }
