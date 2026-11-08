import styled from "styled-components"
import { TriangleButton } from "../elements/DividerWithArrows"

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 10;
`

const Dot = styled.div`
  border-radius: 100%;
  height: 12px;
  width: 12px;
  margin: 5px 0;
  outline: 1px solid var(--lightgrey);
  z-index: 10;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  ::after {
    content: "";
    position: absolute;
    border-radius: 100%;
    height: 50%;
    width: 50%;
    background-color: ${({ isActive }) =>
      isActive ? "var(--red)" : "transparent"};
  }

  :active {
    ::after {
      background-color: var(--red);
    }
  }
`

const ButtonStack = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 8% 8%;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.99;

  @media screen and (max-width: 600px) {
    margin: 10% 6%;
  }
`

const ControlsOverlay = styled(Overlay)`
  left: unset;
  right: 0;
  width: 50%;
  z-index: 11;
  pointer-events: none;

  button {
    pointer-events: auto;
  }

  @media screen and (max-width: 600px) {
    width: 100%;
  }
`

export const Controls = ({ next, prev, selected, selectedClips, disabled }) => {
  return (
    <ControlsOverlay>
      <ButtonStack>
        {selectedClips &&
          selectedClips?.map((clip, i) => (
            <Dot key={i} isActive={selected == i} />
          ))}
        <TriangleButton
          type="button"
          aria-label="Previous featured project"
          disabled={disabled}
          left
          onClick={prev}
          style={{ marginTop: "10px" }}
        />
        <TriangleButton
          type="button"
          aria-label="Next featured project"
          disabled={disabled}
          right
          onClick={next}
        />
      </ButtonStack>
    </ControlsOverlay>
  )
}
