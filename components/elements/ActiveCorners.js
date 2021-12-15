import styled from "styled-components"

const Corners = styled.div`
  position: relative;
  background-color: transparent;
  display: flex;
  margin: 0 0.5em;

  .top,
  .bottom {
    position: absolute;
    width: 6px;
    height: 6px;
    opacity: ${({ active }) => (active ? 1 : 0)};
    transition: all 300ms ease-in;
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
`
export const ActiveCorners = ({ children, active, style }) => {
  return (
    <Corners active={active} style={style}>
      <div className="top left" />
      <div className="top right" />
      <div className="bottom left" />
      <div className="bottom right" />
      {children}
    </Corners>
  )
}
