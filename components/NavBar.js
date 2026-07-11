import styled from "styled-components"
import { NavLink } from "./NavLink"

const Nav = styled.nav`
  align-items: center;
  background-color: transparent;
  display: flex;
  flex-direction: row;
  height: 10em;
  justify-content: space-between;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 20;
  font-weight: 300;
  padding: 0 1em;

  background: linear-gradient(var(--black), transparent);

  @media screen and (max-width: 425px) {
    font-size: 75%;
    height: 7em;
    width: 100%;
    padding: 0 0.5em;
  }

  #logo {
    position: relative;
    display: block;
    margin-left: -1.25em;
    margin-top: 0.5em;
    padding: 1px;
    background-color: var(--red);
    clip-path: polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%);
    isolation: isolate;
    @media screen and (max-width: 425px) {
      margin-left: -0.75em;
    }

    &::before {
      position: absolute;
      content: "";
      inset: 1px;
      background-color: var(--black);
      clip-path: polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%);
      z-index: 0;
    }
  }
`

const Links = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`

const Logo = styled.img`
  position: relative;
  z-index: 1;
  margin: 0.65em 1.35em 0.4em 0.85em;
  height: 35px;
  width: auto;
  transition: transform 0.2s ease-in-out;
  filter: invert(20%) sepia(45%) saturate(6941%) hue-rotate(329deg)
    brightness(95%) contrast(94%);

  @keyframes overshoot {
    0% {
      transform: scale(1);
    }
    20% {
      transform: scale(1.06);
    }
    40% {
      transform: scale(1.04);
    }
    60% {
      transform: scale(1.055);
    }
    80% {
      transform: scale(1.045);
    }
    100% {
      transform: scale(1.05);
    }
  }

  :hover {
    animation: overshoot 0.5s ease-out;
    transform: scale(1.05);
  }
  :active {
    transform: scale(0.95);
  }

  @media screen and (max-width: 425px) {
    height: 25px;
    width: auto;
    margin: 0.55em 1.15em 0.35em 0.75em;
  }
`

export const NavBar = ({ visibleSection }) => {
  return (
    <Nav>
      <a id="logo" href="#">
        <Logo
          src="/images/taggSpray.png"
          alt="TAGG Creative — back to top"
          width="500"
          height="496"
        />
      </a>
      <Links>
        <NavLink href="/#about" active={visibleSection === "about"}>
          WHO WE ARE
        </NavLink>
        <NavLink href="/#works" active={visibleSection === "works"}>
          WORKS
        </NavLink>
        <NavLink href="/#people" active={visibleSection === "people"}>
          PEOPLE
        </NavLink>
        <NavLink href="/#contact" active={visibleSection === "contact"}>
          CONTACT
        </NavLink>
      </Links>
    </Nav>
  )
}
