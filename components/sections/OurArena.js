import PoppedHeader from "../PoppedHeader"
import HomeSection from "./HomeSection"
import { Wrap, Text } from "./Core"
import { AnimatedHeader } from "../elements/AnimatedHeader"
import { useMediaQuery } from "react-responsive"

export default function OurArena() {
  const isMobile = useMediaQuery({ query: "(max-width: 425px)" })
  return (
    <HomeSection
      id="our-arena"
      header="our arena"
      HeaderComponent={() => (
        <AnimatedHeader id="our-arena-header">
          <svg
            width="1273.402"
            height="144.804"
            viewBox="0 0 1273.402 144.804"
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
                d="M 52.231 141.488 A 87.119 87.119 0 0 0 76.602 144.802 A 95.761 95.761 0 0 0 84.623 144.471 A 78.704 78.704 0 0 0 115.802 135.402 Q 133.202 126.002 143.202 109.502 A 67.764 67.764 0 0 0 148.793 97.953 A 72.799 72.799 0 0 0 153.202 72.402 A 83.332 83.332 0 0 0 153.163 69.843 A 69.59 69.59 0 0 0 143.202 35.302 Q 133.202 18.802 115.802 9.402 A 75.614 75.614 0 0 0 100.864 3.294 A 86.783 86.783 0 0 0 76.602 0.002 A 96.294 96.294 0 0 0 69.236 0.28 A 79.543 79.543 0 0 0 37.302 9.402 Q 19.802 18.802 9.902 35.302 Q 0.002 51.802 0.002 72.402 Q 0.002 93.002 9.902 109.502 Q 19.802 126.002 37.302 135.402 A 76.452 76.452 0 0 0 52.231 141.488 Z M 76.602 117.202 A 46.411 46.411 0 0 0 91.674 114.805 A 42.37 42.37 0 0 0 99.002 111.502 Q 109.002 105.802 114.702 95.602 A 44.991 44.991 0 0 0 120.13 77.955 A 55.434 55.434 0 0 0 120.402 72.402 A 50.649 50.649 0 0 0 118.599 58.663 A 43.309 43.309 0 0 0 114.702 49.202 Q 109.002 39.002 99.002 33.302 Q 89.002 27.602 76.602 27.602 A 46.411 46.411 0 0 0 61.53 29.999 A 42.37 42.37 0 0 0 54.202 33.302 Q 44.202 39.002 38.502 49.202 A 44.991 44.991 0 0 0 33.075 66.848 A 55.434 55.434 0 0 0 32.802 72.402 A 50.649 50.649 0 0 0 34.606 86.141 A 43.309 43.309 0 0 0 38.502 95.602 Q 44.202 105.802 54.202 111.502 Q 64.202 117.202 76.602 117.202 Z"
                id="0"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 176.402 80.802 L 176.402 2.402 L 208.802 2.402 L 208.802 79.602 A 66.199 66.199 0 0 0 210.14 93.559 Q 215.262 117.202 240.002 117.202 A 40.595 40.595 0 0 0 249.202 116.222 Q 256.059 114.627 260.861 110.437 A 25.006 25.006 0 0 0 263.202 108.102 A 27.679 27.679 0 0 0 268.345 99.112 Q 269.841 94.969 270.553 89.817 A 74.747 74.747 0 0 0 271.202 79.602 L 271.202 2.402 L 303.202 2.402 L 303.202 80.802 A 91.105 91.105 0 0 1 301.404 99.486 Q 298.988 111.011 293.326 119.777 A 50.422 50.422 0 0 1 286.502 128.202 A 54.722 54.722 0 0 1 261.21 142.269 Q 252.732 144.485 242.7 144.762 A 104.982 104.982 0 0 1 239.802 144.802 Q 209.802 144.802 193.102 128.202 A 53.735 53.735 0 0 1 179.375 104.262 Q 176.96 95.758 176.507 85.586 A 107.589 107.589 0 0 1 176.402 80.802 Z"
                id="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 459.202 142.402 L 424.402 142.402 L 397.402 103.402 L 395.802 103.402 L 367.602 103.402 L 367.602 142.402 L 335.202 142.402 L 335.202 2.402 L 395.802 2.402 A 94.323 94.323 0 0 1 411.139 3.589 Q 420.396 5.114 428.102 8.602 A 52.244 52.244 0 0 1 441.042 16.797 A 44.895 44.895 0 0 1 449.202 26.202 A 45.653 45.653 0 0 1 456.049 44.985 A 59.229 59.229 0 0 1 456.602 53.202 A 54.454 54.454 0 0 1 454.954 66.882 A 43.364 43.364 0 0 1 449.102 80.102 A 45.971 45.971 0 0 1 432.756 94.966 A 57.534 57.534 0 0 1 427.802 97.402 L 459.202 142.402 Z M 394.002 28.802 L 367.602 28.802 L 367.602 77.602 L 394.002 77.602 A 53.254 53.254 0 0 0 402.395 76.985 Q 406.679 76.3 410.131 74.854 A 23.354 23.354 0 0 0 416.202 71.202 A 20.869 20.869 0 0 0 423.426 58.11 A 30.671 30.671 0 0 0 423.802 53.202 A 29.228 29.228 0 0 0 422.904 45.739 A 20.105 20.105 0 0 0 416.202 35.102 A 24.456 24.456 0 0 0 408.213 30.795 Q 402.215 28.802 394.002 28.802 Z"
                id="2"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(-5px)" }}
              />
              <path
                d="M 643.402 142.402 L 631.002 112.402 L 566.002 112.402 L 553.602 142.402 L 520.402 142.402 L 582.802 2.402 L 614.802 2.402 L 677.402 142.402 L 643.402 142.402 Z M 576.402 87.802 L 620.802 87.802 L 598.602 34.202 L 576.402 87.802 Z"
                id="4"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(1px)" }}
              />
              <path
                d="M 816.002 142.402 L 781.202 142.402 L 754.202 103.402 L 752.602 103.402 L 724.402 103.402 L 724.402 142.402 L 692.002 142.402 L 692.002 2.402 L 752.602 2.402 A 94.323 94.323 0 0 1 767.939 3.589 Q 777.196 5.114 784.902 8.602 A 52.244 52.244 0 0 1 797.842 16.797 A 44.895 44.895 0 0 1 806.002 26.202 A 45.653 45.653 0 0 1 812.849 44.985 A 59.229 59.229 0 0 1 813.402 53.202 A 54.454 54.454 0 0 1 811.754 66.882 A 43.364 43.364 0 0 1 805.902 80.102 A 45.971 45.971 0 0 1 789.556 94.966 A 57.534 57.534 0 0 1 784.602 97.402 L 816.002 142.402 Z M 750.802 28.802 L 724.402 28.802 L 724.402 77.602 L 750.802 77.602 A 53.254 53.254 0 0 0 759.195 76.985 Q 763.479 76.3 766.931 74.854 A 23.354 23.354 0 0 0 773.002 71.202 A 20.869 20.869 0 0 0 780.226 58.11 A 30.671 30.671 0 0 0 780.602 53.202 A 29.228 29.228 0 0 0 779.704 45.739 A 20.105 20.105 0 0 0 773.002 35.102 A 24.456 24.456 0 0 0 765.013 30.795 Q 759.015 28.802 750.802 28.802 Z"
                id="5"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(5px)" }}
              />
              <path
                d="M 871.202 116.402 L 947.402 116.402 L 947.402 142.402 L 839.002 142.402 L 839.002 2.402 L 944.802 2.402 L 944.802 28.402 L 871.202 28.402 L 871.202 58.802 L 936.202 58.802 L 936.202 84.002 L 871.202 84.002 L 871.202 116.402 Z"
                id="6"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(5px)" }}
              />
              <path
                d="M 1069.602 2.402 L 1101.602 2.402 L 1101.602 142.402 L 1075.002 142.402 L 1005.202 57.402 L 1005.202 142.402 L 973.202 142.402 L 973.202 2.402 L 1000.002 2.402 L 1069.602 87.402 L 1069.602 2.402 Z"
                id="7"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(5px)" }}
              />
              <path
                d="M 1239.402 142.402 L 1227.002 112.402 L 1162.002 112.402 L 1149.602 142.402 L 1116.402 142.402 L 1178.802 2.402 L 1210.802 2.402 L 1273.402 142.402 L 1239.402 142.402 Z M 1172.402 87.802 L 1216.802 87.802 L 1194.602 34.202 L 1172.402 87.802 Z"
                id="8"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(6px)" }}
              />
            </g>
          </svg>
        </AnimatedHeader>
      )}
      // sectionStyle={{ height: "fit-content", marginBottom: "15vh" }}
      contentStyle={{
        height: "fit-content",
        marginTop: "-10px",
        marginBottom: !isMobile ? "10vh" : "-5vh",
      }}
    >
      <Wrap>
        <Text gridArea="a">
          <PoppedHeader>DOCUMENTARY BY DESIGN</PoppedHeader>
          <p>
            We tell real stories. Docu-style. No actors. No scripts. No staged
            moments pretending to be something they’re not. We work with
            founders, teams, and companies with something to say—and say it in a
            way that actually lands. This isn’t content for content’s sake. It’s
            story with a day job.
          </p>
        </Text>
        <Text gridArea="b">
          <PoppedHeader>EDITORIAL BY NATURE</PoppedHeader>
          <p>
            We’re editors first. Always have been. That means we see the end at
            the beginning. We think in structure, rhythm, timing—what actually
            works in the cut. So when we produce, we produce on purpose.
            <br />
            <br />
            We also offer edit only services if that’s your jam.
          </p>
        </Text>
        <Text gridArea="c">
          <PoppedHeader>CAMERAS OPTIONAL</PoppedHeader>
          <p>
            Not everything needs a camera crew. Some stories can be built
            without setting foot on set. With generative AI, stock footage, and
            archival gems, we can craft the story without ever rolling a frame.
            Just faster, leaner, and often, way more efficient.
            <br />
            <br />
            We’ll miss crafty, though.
          </p>
        </Text>
        <Text gridArea="d">
          <PoppedHeader>CREATIVE INCLUDED</PoppedHeader>
          <p>
            We don’t wait for the boards. We shape the creative from day one.
            Ideas, angles, formats, hooks. It’s all part of the work. We find the
            angle, craft the story, and build the thing from the ground up. Some
            folks think you need an agency to crack the concept.
            <br />
            <br />
            We don’t.
          </p>
        </Text>
      </Wrap>
    </HomeSection>
  )
}
