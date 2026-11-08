import styled from "styled-components"
import { useEffect, useRef, useState } from "react"
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

export const NavLink = ({ href, children, active, onSelect }) => {
  const [motionPhase, setMotionPhase] = useState(active ? "active" : "idle")
  const previousActive = useRef(active)
  const phaseTimer = useRef(null)

  useEffect(() => {
    if (previousActive.current === active) return undefined

    if (phaseTimer.current) clearTimeout(phaseTimer.current)
    setMotionPhase(active ? "entering" : "exiting")
    phaseTimer.current = setTimeout(
      () => setMotionPhase(active ? "active" : "idle"),
      active ? 620 : 260,
    )
    previousActive.current = active

    return () => {
      if (phaseTimer.current) clearTimeout(phaseTimer.current)
    }
  }, [active])

  const handleClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    onSelect?.()
  }

  return (
    <ActiveCorners active={active} motionPhase={motionPhase}>
      <StyledA
        href={href}
        onClick={handleClick}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </StyledA>
    </ActiveCorners>
  )
}
