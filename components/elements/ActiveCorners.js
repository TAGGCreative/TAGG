import styled from "styled-components"

const Corners = styled.div`
  position: relative;
  background-color: transparent;
  display: flex;
  margin: 0 0.5em;
  transition: background-color 0.2s ease-in-out;

  ${({ enableHover }) =>
    enableHover &&
    `
    &:hover {
      background-color: rgba(237, 26, 98, 0.15);
    }
  `}

  .top,
  .bottom {
    position: absolute;
    width: 6px;
    height: 6px;
    opacity: 0;
    transition: opacity 300ms ease-in;
    filter: none;
    will-change: top, right, bottom, left, opacity, filter;
  }

  .top {
    top: 0;
    border-top: 2px solid var(--red);
    align-self: flex-start;
  }

  .bottom {
    bottom: 0;
    border-bottom: 2px solid var(--red);
    align-self: flex-end;
  }

  .left {
    left: 0;
    border-left: 2px solid var(--red);
    justify-self: left;
  }

  .right {
    right: 0;
    border-right: 2px solid var(--red);
    justify-self: right;
  }

  &[data-motion-phase="active"] .top,
  &[data-motion-phase="active"] .bottom {
    opacity: 1;
  }

  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 2px;
    content: "";
    pointer-events: none;
    background: var(--red);
    box-shadow: 0 0 8px var(--red);
    opacity: 0;
    transform: translate(-50%, -50%);
  }

  @keyframes top-left-lock {
    0% {
      top: 0;
      left: 0;
      opacity: 1;
      filter: none;
    }
    34% {
      opacity: 1;
    }
    54% {
      opacity: 0;
    }
    100% {
      top: calc(50% - 6px);
      left: calc(50% - 6px);
      opacity: 0;
      filter: drop-shadow(0 0 4px var(--red));
    }
  }

  @keyframes top-right-lock {
    0% {
      top: 0;
      right: 0;
      opacity: 1;
      filter: none;
    }
    34% {
      opacity: 1;
    }
    54% {
      opacity: 0;
    }
    100% {
      top: calc(50% - 6px);
      right: calc(50% - 6px);
      opacity: 0;
      filter: drop-shadow(0 0 4px var(--red));
    }
  }

  @keyframes bottom-left-lock {
    0% {
      bottom: 0;
      left: 0;
      opacity: 1;
      filter: none;
    }
    34% {
      opacity: 1;
    }
    54% {
      opacity: 0;
    }
    100% {
      bottom: calc(50% - 6px);
      left: calc(50% - 6px);
      opacity: 0;
      filter: drop-shadow(0 0 4px var(--red));
    }
  }

  @keyframes bottom-right-lock {
    0% {
      right: 0;
      bottom: 0;
      opacity: 1;
      filter: none;
    }
    34% {
      opacity: 1;
    }
    54% {
      opacity: 0;
    }
    100% {
      right: calc(50% - 6px);
      bottom: calc(50% - 6px);
      opacity: 0;
      filter: drop-shadow(0 0 4px var(--red));
    }
  }

  @keyframes lock-blip {
    0%,
    61% {
      opacity: 0;
    }
    62%,
    68% {
      opacity: 1;
    }
    68.1%,
    74% {
      opacity: 0;
    }
    74.1%,
    80% {
      opacity: 1;
    }
    80.1%,
    86% {
      opacity: 0;
    }
    86.1%,
    92% {
      opacity: 1;
    }
    92.1%,
    100% {
      opacity: 0;
    }
  }

  @keyframes top-left-arrive {
    0% {
      top: calc(50% - 6px);
      left: calc(50% - 6px);
      opacity: 0;
      filter: none;
    }
    26% {
      opacity: 0;
    }
    42% {
      opacity: 0.55;
      filter: drop-shadow(0 0 3px var(--red));
    }
    42.1%,
    49% {
      opacity: 0;
    }
    49.1%,
    61% {
      opacity: 1;
      filter: drop-shadow(0 0 4px var(--red));
    }
    61.1%,
    68% {
      opacity: 0.08;
    }
    68.1%,
    80% {
      opacity: 1;
    }
    80.1%,
    86% {
      opacity: 0;
    }
    86.1%,
    94% {
      opacity: 1;
    }
    94.1%,
    97% {
      opacity: 0.25;
    }
    97.1%,
    100% {
      top: 0;
      left: 0;
      opacity: 1;
      filter: none;
    }
  }

  @keyframes top-right-arrive {
    0% {
      top: calc(50% - 6px);
      right: calc(50% - 6px);
      opacity: 0;
      filter: none;
    }
    26% {
      opacity: 0;
    }
    42% {
      opacity: 0.55;
      filter: drop-shadow(0 0 3px var(--red));
    }
    42.1%,
    49% {
      opacity: 0;
    }
    49.1%,
    61% {
      opacity: 1;
      filter: drop-shadow(0 0 4px var(--red));
    }
    61.1%,
    68% {
      opacity: 0.08;
    }
    68.1%,
    80% {
      opacity: 1;
    }
    80.1%,
    86% {
      opacity: 0;
    }
    86.1%,
    94% {
      opacity: 1;
    }
    94.1%,
    97% {
      opacity: 0.25;
    }
    97.1%,
    100% {
      top: 0;
      right: 0;
      opacity: 1;
      filter: none;
    }
  }

  @keyframes bottom-left-arrive {
    0% {
      bottom: calc(50% - 6px);
      left: calc(50% - 6px);
      opacity: 0;
      filter: none;
    }
    26% {
      opacity: 0;
    }
    42% {
      opacity: 0.55;
      filter: drop-shadow(0 0 3px var(--red));
    }
    42.1%,
    49% {
      opacity: 0;
    }
    49.1%,
    61% {
      opacity: 1;
      filter: drop-shadow(0 0 4px var(--red));
    }
    61.1%,
    68% {
      opacity: 0.08;
    }
    68.1%,
    80% {
      opacity: 1;
    }
    80.1%,
    86% {
      opacity: 0;
    }
    86.1%,
    94% {
      opacity: 1;
    }
    94.1%,
    97% {
      opacity: 0.25;
    }
    97.1%,
    100% {
      bottom: 0;
      left: 0;
      opacity: 1;
      filter: none;
    }
  }

  @keyframes bottom-right-arrive {
    0% {
      right: calc(50% - 6px);
      bottom: calc(50% - 6px);
      opacity: 0;
      filter: none;
    }
    26% {
      opacity: 0;
    }
    42% {
      opacity: 0.55;
      filter: drop-shadow(0 0 3px var(--red));
    }
    42.1%,
    49% {
      opacity: 0;
    }
    49.1%,
    61% {
      opacity: 1;
      filter: drop-shadow(0 0 4px var(--red));
    }
    61.1%,
    68% {
      opacity: 0.08;
    }
    68.1%,
    80% {
      opacity: 1;
    }
    80.1%,
    86% {
      opacity: 0;
    }
    86.1%,
    94% {
      opacity: 1;
    }
    94.1%,
    97% {
      opacity: 0.25;
    }
    97.1%,
    100% {
      right: 0;
      bottom: 0;
      opacity: 1;
      filter: none;
    }
  }

  &[data-motion-phase="exiting"] .top.left {
    animation: top-left-lock 240ms cubic-bezier(0.7, 0, 0.3, 1) both;
  }
  &[data-motion-phase="exiting"] .top.right {
    animation: top-right-lock 240ms cubic-bezier(0.7, 0, 0.3, 1) both;
  }
  &[data-motion-phase="exiting"] .bottom.left {
    animation: bottom-left-lock 240ms cubic-bezier(0.7, 0, 0.3, 1) both;
  }
  &[data-motion-phase="exiting"] .bottom.right {
    animation: bottom-right-lock 240ms cubic-bezier(0.7, 0, 0.3, 1) both;
  }

  &[data-motion-phase="exiting"]::after {
    animation: none;
  }

  &[data-motion-phase="entering"] .top.left {
    animation: top-left-arrive 440ms cubic-bezier(0.22, 0.75, 0.25, 1) 170ms
      both;
  }
  &[data-motion-phase="entering"] .top.right {
    animation: top-right-arrive 440ms cubic-bezier(0.22, 0.75, 0.25, 1) 170ms
      both;
  }
  &[data-motion-phase="entering"] .bottom.left {
    animation: bottom-left-arrive 440ms cubic-bezier(0.22, 0.75, 0.25, 1) 170ms
      both;
  }
  &[data-motion-phase="entering"] .bottom.right {
    animation: bottom-right-arrive 440ms cubic-bezier(0.22, 0.75, 0.25, 1) 170ms
      both;
  }

  &[data-motion-phase="entering"]::after {
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-motion-phase="entering"] .top,
    &[data-motion-phase="entering"] .bottom {
      opacity: 1;
      animation: none;
    }

    &[data-motion-phase="exiting"] .top,
    &[data-motion-phase="exiting"] .bottom {
      opacity: 0;
      animation: none;
    }

    &::after {
      animation: none !important;
    }
  }
`
export const ActiveCorners = ({
  children,
  active,
  motionPhase,
  style,
  enableHover,
}) => {
  const phase = motionPhase || (active ? "active" : "idle")

  return (
    <Corners data-motion-phase={phase} style={style} enableHover={enableHover}>
      <div className="top left" />
      <div className="top right" />
      <div className="bottom left" />
      <div className="bottom right" />
      {children}
    </Corners>
  )
}
