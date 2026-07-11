import styled, { css } from "styled-components"

const Popped = styled.h2`
  background-color: transparent;
  color: var(--lightgrey);
  font-family: Montserrat-Bold;
  font-weight: 700;
  letter-spacing: 50;
  margin-top: 0;
  margin-bottom: 1em;
  text-transform: uppercase;
  user-select: none;
  z-index: 3;
  transition: text-shadow 0.2s ease-in-out;

  ${({ noShadow }) => {
    if (!noShadow)
      return css`
        text-shadow: -0.1em 0.1em var(--red);
      `
  }}

  ${({ noShadow }) => {
    if (noShadow)
      return css`
        &:hover {
          text-shadow: -0.1em 0.1em var(--red);
        }
      `
  }}

  a {
    z-index: 3;
  }
`
export default function PoppedHeader({ children, style, noShadow }) {
  return (
    <Popped style={style} noShadow={noShadow}>
      {children}
    </Popped>
  )
}
