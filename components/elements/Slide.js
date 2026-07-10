import styled from "styled-components"
import Link from "next/link"
import PoppedHeader from "../PoppedHeader"
import { ActiveCorners } from "./ActiveCorners"

const TitleContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  margin: 8% 8%;
  display: flex;
  flex-direction: column;
  text-align: left;

  a {
    transition: background-color 0.2s ease-in-out;
  }
`

const WatchButton = () => (
  <ActiveCorners
    active={true}
    enableHover={true}
    style={{
      width: "calc(9ch + 1em)",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "var(--red)",
      fontFamily: "Consolas, sans-serif",
      margin: 0,
      padding: ".5em 2em",
      userSelect: "none",
      zIndex: 10,
      opacity: 0.99, // attempt to break stacking context...
    }}
  >
    WATCH
  </ActiveCorners>
)

export const Slide = ({ client, title, href }) => {
  return (
    <TitleContainer>
      <PoppedHeader style={{ margin: 0 }}>{client}</PoppedHeader>
      <p>{title}</p>
      <Link
        href={href}
        aria-label={`Watch ${client}: ${title}`}
        style={{
          width: "fit-content",
        }}
      >
        <WatchButton />
      </Link>
    </TitleContainer>
  )
}
