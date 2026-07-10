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
  width: 100vw;
  z-index: 20;
  font-weight: 300;
  padding: 0 1em;

  background: linear-gradient(var(--black), transparent);

  @media screen and (max-width: 425px) {
    font-size: 75%;
    height: 7em;
    width: calc(100vw + 1em);
  }
  
  #logo {
    position: relative;
    margin-left: -1.25em;
    margin-top: .5em;
    outline: 1px solid var(--red);
    /* box-shadow: 4px 4px var(--red), 0 4px var(--red); */
    background-color: var(--black);
    @media screen and (max-width: 425px) {
      padding-left: 1em;
    }
    
    ::before {
      position: absolute;
      content: "";
      height: calc(100% + 5px);
      width: calc(100% + 5px);
      top: 0;
      left: 0;
      background-color: var(--red);
      clip-path:  polygon(95% 0, 100% 10%, 100% 100%, 0 100%, 0 0);
      z-index: -1;
    }
}


    @media screen and (max-width: 425px) {
      margin: 0 -15px;
    }
  }
`

const Links = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`

const Logo = styled.img`
  margin: 0.75em;
  margin-bottom: 0.35em;
  margin-left: 1em;
  height: 35px;
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
    margin-left: 1em;
  }
`

export const NavBar = ({ visibleSection }) => {
  return (
    <Nav>
      <a id="logo" href="#">
        <Logo src="/images/taggSpray.png" alt="TAGG Creative — back to top" />
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
