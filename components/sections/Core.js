import styled from "styled-components"
import HomeSection from "./HomeSection"
import PoppedHeader from "../PoppedHeader"
import { AnimatedHeader } from "../elements/AnimatedHeader"
import { useMediaQuery } from "react-responsive"

export const Wrap = styled.div`
  display: grid;
  max-width: 100%;
  padding: 0 5%;
  padding-bottom: 0;
  margin-top: -45px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-gap: 5% 10%;
  grid-template-areas:
    "a c"
    "b d";
  @media screen and (max-width: 425px) {
    display: block;
    padding: 0 0;
    width: 100%;
  }
`

export const Text = styled.div`
  padding-bottom: 2em;
  margin-right: auto;
  grid-area: ${({ gridArea }) => gridArea};
  transform: ${({ gridArea }) => {
    return gridArea === "c" || gridArea === "d" ? "translateY(45%)" : "0"
  }};

  @media screen and (max-width: 425px) {
    padding: 2em 0;
    margin-top: 0;
    width: 100%;
    transform: none;
  }
`

export default function Core() {
  const isMobile = useMediaQuery({ query: "(max-width: 425px)" })
  return (
    <HomeSection
      id="core"
      header="core"
      sectionStyle={{ marginTop: !isMobile ? "15vh" : 0 }}
      HeaderComponent={() => (
        <AnimatedHeader id="core-header">
          <svg
            width="576.602"
            height="144.804"
            viewBox="0 0 576.602 144.804"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="svgGroup"
              strokeLinecap="round"
              fillRule="evenodd"
              // font-size="9pt"
              // stroke="#000"
              // stroke-width="0.25mm"
              // fill="none"
              // style="stroke:#000;stroke-width:0.25mm;fill:none"
            >
              <path
                d="M 133.602 24.802 L 112.802 44.002 A 48.147 48.147 0 0 0 98.029 32.247 A 44.868 44.868 0 0 0 77.602 27.602 A 50.649 50.649 0 0 0 63.863 29.405 A 43.309 43.309 0 0 0 54.402 33.302 Q 44.202 39.002 38.502 49.202 A 44.991 44.991 0 0 0 33.075 66.848 A 55.434 55.434 0 0 0 32.802 72.402 A 50.649 50.649 0 0 0 34.606 86.141 A 43.309 43.309 0 0 0 38.502 95.602 Q 44.202 105.802 54.402 111.502 A 44.991 44.991 0 0 0 72.049 116.929 A 55.434 55.434 0 0 0 77.602 117.202 A 44.023 44.023 0 0 0 110.542 103.094 A 57.298 57.298 0 0 0 112.802 100.602 L 133.602 119.802 Q 123.602 132.002 108.802 138.402 A 78.096 78.096 0 0 1 85.771 144.296 A 95.988 95.988 0 0 1 75.802 144.802 A 84.851 84.851 0 0 1 50.654 141.169 A 75.672 75.672 0 0 1 37.102 135.502 Q 19.802 126.202 9.902 109.702 Q 0.002 93.202 0.002 72.402 A 74.847 74.847 0 0 1 3.773 48.365 A 67.695 67.695 0 0 1 9.902 35.102 Q 19.802 18.602 37.102 9.302 A 78.466 78.466 0 0 1 68.053 0.329 A 95.097 95.097 0 0 1 76.002 0.002 A 89.269 89.269 0 0 1 95.37 2.027 A 73.895 73.895 0 0 1 108.902 6.402 Q 123.602 12.802 133.602 24.802 Z"
                id="0"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 195.831 141.488 A 87.119 87.119 0 0 0 220.202 144.802 A 95.761 95.761 0 0 0 228.222 144.471 A 78.704 78.704 0 0 0 259.402 135.402 Q 276.802 126.002 286.802 109.502 A 67.764 67.764 0 0 0 292.392 97.953 A 72.799 72.799 0 0 0 296.802 72.402 A 83.332 83.332 0 0 0 296.763 69.843 A 69.59 69.59 0 0 0 286.802 35.302 Q 276.802 18.802 259.402 9.402 A 75.614 75.614 0 0 0 244.464 3.294 A 86.783 86.783 0 0 0 220.202 0.002 A 96.294 96.294 0 0 0 212.835 0.28 A 79.543 79.543 0 0 0 180.902 9.402 Q 163.402 18.802 153.502 35.302 Q 143.602 51.802 143.602 72.402 Q 143.602 93.002 153.502 109.502 Q 163.402 126.002 180.902 135.402 A 76.452 76.452 0 0 0 195.831 141.488 Z M 220.202 117.202 A 46.411 46.411 0 0 0 235.274 114.805 A 42.37 42.37 0 0 0 242.602 111.502 Q 252.602 105.802 258.302 95.602 A 44.991 44.991 0 0 0 263.729 77.955 A 55.434 55.434 0 0 0 264.002 72.402 A 50.649 50.649 0 0 0 262.199 58.663 A 43.309 43.309 0 0 0 258.302 49.202 Q 252.602 39.002 242.602 33.302 Q 232.602 27.602 220.202 27.602 A 46.411 46.411 0 0 0 205.13 29.999 A 42.37 42.37 0 0 0 197.802 33.302 Q 187.802 39.002 182.102 49.202 A 44.991 44.991 0 0 0 176.675 66.848 A 55.434 55.434 0 0 0 176.402 72.402 A 50.649 50.649 0 0 0 178.206 86.141 A 43.309 43.309 0 0 0 182.102 95.602 Q 187.802 105.802 197.802 111.502 Q 207.802 117.202 220.202 117.202 Z"
                id="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 445.202 142.402 L 410.402 142.402 L 383.402 103.402 L 381.802 103.402 L 353.602 103.402 L 353.602 142.402 L 321.202 142.402 L 321.202 2.402 L 381.802 2.402 A 94.323 94.323 0 0 1 397.139 3.589 Q 406.396 5.114 414.102 8.602 A 52.244 52.244 0 0 1 427.042 16.797 A 44.895 44.895 0 0 1 435.202 26.202 A 45.653 45.653 0 0 1 442.049 44.985 A 59.229 59.229 0 0 1 442.602 53.202 A 54.454 54.454 0 0 1 440.954 66.882 A 43.364 43.364 0 0 1 435.102 80.102 A 45.971 45.971 0 0 1 418.756 94.966 A 57.534 57.534 0 0 1 413.802 97.402 L 445.202 142.402 Z M 380.002 28.802 L 353.602 28.802 L 353.602 77.602 L 380.002 77.602 A 53.254 53.254 0 0 0 388.395 76.985 Q 392.679 76.3 396.13 74.854 A 23.354 23.354 0 0 0 402.202 71.202 A 20.869 20.869 0 0 0 409.425 58.11 A 30.671 30.671 0 0 0 409.802 53.202 A 29.228 29.228 0 0 0 408.904 45.739 A 20.105 20.105 0 0 0 402.202 35.102 A 24.456 24.456 0 0 0 394.212 30.795 Q 388.215 28.802 380.002 28.802 Z"
                id="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 500.402 116.402 L 576.602 116.402 L 576.602 142.402 L 468.202 142.402 L 468.202 2.402 L 574.002 2.402 L 574.002 28.402 L 500.402 28.402 L 500.402 58.802 L 565.402 58.802 L 565.402 84.002 L 500.402 84.002 L 500.402 116.402 Z"
                id="3"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>
        </AnimatedHeader>
      )}
    >
      <Wrap>
        <Text gridArea="a">
          <PoppedHeader>PRETTY ISN'T THE POINT</PoppedHeader>
          <p>
            Nice shots are table stakes. Anyone can make something pretty. We
            make pretty mean something. No one cares what camera you used—if it
            got them out of bed on Monday.
          </p>
        </Text>

        <Text gridArea="b">
          <PoppedHeader>LEAN, SMART, AND INDEPENDANT.</PoppedHeader>
          <p>
            No hand-holding. No game of telephone. No endless CC threads. Just
            give us the idea and let us run. We curate the right team—project by
            project, from the best talent around the world. High standards, low
            drama.
          </p>
        </Text>

        <Text mt="50%" gridArea="c">
          <PoppedHeader className="dropped">PARTNERS &gt; CLIENTS</PoppedHeader>
          <p>
            Think{" "}
            <span style={{ fontStyle: "italic" }}>
              same team, different office
            </span>
            . Just because we aren’t in the same place, doesn’t mean we can’t
            build a relationship like we are.
            <br />
            <br />
            It’s simple——when we have each other’s back we’ll make better
            content together.
            <br />
            <br />
            We also expect an invite to your christmas party… Just kidding.
          </p>
        </Text>
      </Wrap>
    </HomeSection>
  )
}
