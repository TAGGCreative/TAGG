import styled from "styled-components"
import { useEffect, useRef, useState } from "react"
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
    display: grid;
    place-items: center;
    width: 68px;
    height: 62px;
    margin-left: -1em;
    margin-top: 0.5em;
    padding: 1px;
    box-sizing: border-box;
    background-color: var(--red);
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
    filter: drop-shadow(5px 6px 0 var(--red));
    isolation: isolate;

    @media screen and (max-width: 425px) {
      width: 52px;
      height: 48px;
      margin-left: -0.5em;
      filter: drop-shadow(4px 4px 0 var(--red));
    }

    &::before {
      position: absolute;
      content: "";
      inset: 1px;
      background-color: var(--black);
      clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%);
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
  margin: 0;
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
    margin: 0;
  }
`

export const NavBar = ({ visibleSection }) => {
  const [displayedSection, setDisplayedSection] = useState(visibleSection)
  const pendingSection = useRef(null)
  const pendingTimer = useRef(null)
  const lastVisibleSection = useRef(visibleSection)

  useEffect(() => {
    lastVisibleSection.current = visibleSection
    if (pendingSection.current && visibleSection !== pendingSection.current)
      return

    if (pendingTimer.current) clearTimeout(pendingTimer.current)
    pendingSection.current = null
    setDisplayedSection(visibleSection)
  }, [visibleSection])

  useEffect(
    () => () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current)
    },
    [],
  )

  const selectSection = (section) => {
    if (section === displayedSection) return
    if (pendingTimer.current) clearTimeout(pendingTimer.current)
    pendingSection.current = section
    setDisplayedSection(section)
    pendingTimer.current = setTimeout(() => {
      pendingSection.current = null
      setDisplayedSection(lastVisibleSection.current || section)
    }, 1600)
  }

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
        <NavLink
          href="/#about"
          active={displayedSection === "about"}
          onSelect={() => selectSection("about")}
        >
          WHO WE ARE
        </NavLink>
        <NavLink
          href="/#works"
          active={displayedSection === "works"}
          onSelect={() => selectSection("works")}
        >
          WORKS
        </NavLink>
        <NavLink
          href="/#people"
          active={displayedSection === "people"}
          onSelect={() => selectSection("people")}
        >
          PEOPLE
        </NavLink>
        <NavLink
          href="/#contact"
          active={displayedSection === "contact"}
          onSelect={() => selectSection("contact")}
        >
          CONTACT
        </NavLink>
      </Links>
    </Nav>
  )
}
