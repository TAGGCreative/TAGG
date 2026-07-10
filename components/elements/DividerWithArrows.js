import styled from "styled-components"

export const TriangleButton = styled.button`
  height: 40px;
  width: 40px;
  border: 1px solid var(--lightgrey);
  border-radius: 5%;
  position: relative;
  margin-bottom: -1px;
  transition: background-color 0.2s ease-in-out;
  cursor: pointer;
  padding: 0;
  background-color: transparent;

  &:hover {
    background-color: rgba(237, 26, 98, 0.15);
  }
  &:active {
    background-color: var(--red);
    ::after {
      border-left: 2px solid var(--white);
      border-bottom: 2px solid var(--white);
    }
  }
  &:focus-visible {
    outline: 2px solid var(--white);
    outline-offset: 2px;
  }
  &::after {
    content: "";
    position: absolute;
    top: 35%;
    left: ${({ left }) => (left ? "40%" : "30%")};
    width: 25%;
    height: 25%;
    border-left: 2px solid var(--red);
    border-bottom: 2px solid var(--red);
    transform: ${({ left, right }) =>
      left ? "rotate(45deg)" : right ? "rotate(-135deg)" : "rotate(0deg)"};
    transition: all 0.2s ease-in-out;
  }
`

const Divider = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  border-bottom: 1px solid var(--grey);
`

export const DividerWithArrows = ({ onLeft, onRight }) => {
  return (
    <Divider>
      <TriangleButton
        type="button"
        aria-label="Previous project"
        onClick={onLeft}
        left
      />
      <TriangleButton
        type="button"
        aria-label="Next project"
        onClick={onRight}
        right
      />
    </Divider>
  )
}
