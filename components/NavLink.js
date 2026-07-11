import styled from "styled-components"
import { ActiveCorners } from "./elements/ActiveCorners"

const StyledA = styled.a`
  text-decoration: none;
  padding: 0.5em 0.5em;
  display: block;
  color: var(--grey);
  font-weight: 400;
  background-color: transparent;
  font-family: Montserrat;
  font-size: 1.1em;
  margin-right: 0.5em;
  margin-left: 0.5em;
  user-select: none;

  @media screen and (max-width: 425px) {
    margin: 0;
  }

  :hover {
    color: var(--lightgrey);
  }
`

export const NavLink = ({ href, children, active }) => {
  return (
    <ActiveCorners active={active}>
      <StyledA href={href}>{children}</StyledA>
    </ActiveCorners>
  )
}
