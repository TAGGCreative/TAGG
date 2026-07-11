import styled from "styled-components"
import HomeSection from "./HomeSection"
import Client from "../elements/HoverLogo"
import { AnimatedHeader } from "../elements/AnimatedHeader"

const OurRepSection = styled(HomeSection)`
  margin-top: -35vh;
  margin-bottom: 15vh;

  @media screen and (max-width: 425px) {
    margin-top: -20vh;
    margin-bottom: 10vh;
  }
`

const Flow = styled.div`
  padding: 0 8%;
  margin-top: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  line-height: 0;

  a {
    margin: -10px -8px;
  }

  a:first-of-type {
    margin-left: -8px;
  }

  #ucla {
    padding-left: 0;
  }

  @media screen and (max-width: 425px) {
    padding: 0 0;
    max-height: 90vh;
    margin-top: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-flow: row wrap;

    a {
      margin: -5px -4px;
    }

    a:first-of-type {
      margin-left: -4px;
    }
  }
`

export default function OurRep() {
  return (
    <OurRepSection
      id="our-rep"
      header="our rep"
      HeaderComponent={() => (
        <AnimatedHeader id="our-rep-header">
          <svg
            width="941.404"
            height="144.804"
            viewBox="0 0 941.404 144.804"
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
                d="M 662.802 142.402 L 628.002 142.402 L 601.002 103.402 L 599.402 103.402 L 571.202 103.402 L 571.202 142.402 L 538.802 142.402 L 538.802 2.402 L 599.402 2.402 A 94.323 94.323 0 0 1 614.739 3.589 Q 623.996 5.114 631.702 8.602 A 52.244 52.244 0 0 1 644.642 16.797 A 44.895 44.895 0 0 1 652.802 26.202 A 45.653 45.653 0 0 1 659.649 44.985 A 59.229 59.229 0 0 1 660.202 53.202 A 54.454 54.454 0 0 1 658.554 66.882 A 43.364 43.364 0 0 1 652.702 80.102 A 45.971 45.971 0 0 1 636.356 94.966 A 57.534 57.534 0 0 1 631.402 97.402 L 662.802 142.402 Z M 597.602 28.802 L 571.202 28.802 L 571.202 77.602 L 597.602 77.602 A 53.254 53.254 0 0 0 605.995 76.985 Q 610.279 76.3 613.731 74.854 A 23.354 23.354 0 0 0 619.802 71.202 A 20.869 20.869 0 0 0 627.026 58.11 A 30.671 30.671 0 0 0 627.402 53.202 A 29.228 29.228 0 0 0 626.504 45.739 A 20.105 20.105 0 0 0 619.802 35.102 A 24.456 24.456 0 0 0 611.813 30.795 Q 605.815 28.802 597.602 28.802 Z"
                id="4"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 718.002 116.402 L 794.202 116.402 L 794.202 142.402 L 685.802 142.402 L 685.802 2.402 L 791.602 2.402 L 791.602 28.402 L 718.002 28.402 L 718.002 58.802 L 783.002 58.802 L 783.002 84.002 L 718.002 84.002 L 718.002 116.402 Z"
                id="5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 880.602 103.802 L 852.402 103.802 L 852.402 142.402 L 820.002 142.402 L 820.002 2.402 L 880.602 2.402 A 94.323 94.323 0 0 1 895.939 3.589 Q 905.196 5.114 912.902 8.602 A 52.244 52.244 0 0 1 925.842 16.797 A 44.895 44.895 0 0 1 934.002 26.202 A 45.653 45.653 0 0 1 940.849 44.985 A 59.229 59.229 0 0 1 941.402 53.202 A 54.074 54.074 0 0 1 939.494 67.837 A 44.904 44.904 0 0 1 934.002 80.102 A 45.93 45.93 0 0 1 917.03 95.664 A 56.886 56.886 0 0 1 912.902 97.702 A 67.859 67.859 0 0 1 896.963 102.462 Q 889.799 103.718 881.688 103.797 A 112.127 112.127 0 0 1 880.602 103.802 Z M 878.802 28.802 L 852.402 28.802 L 852.402 77.402 L 878.802 77.402 A 54.159 54.159 0 0 0 887.147 76.802 Q 895.748 75.458 901.002 71.102 A 20.484 20.484 0 0 0 908.185 58.348 A 30.355 30.355 0 0 0 908.602 53.202 A 29.228 29.228 0 0 0 907.704 45.739 A 20.105 20.105 0 0 0 901.002 35.102 A 24.456 24.456 0 0 0 893.013 30.795 Q 887.015 28.802 878.802 28.802 Z"
                id="6"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(-5px)" }}
              />
            </g>
          </svg>
        </AnimatedHeader>
      )}
    >
      <Flow>
        <Client
          label="Amazon"
          src="amazon.svg"
          href="https://aws.amazon.com/"
        />
        <Client
          label="Coca-Cola"
          src="cocacola.svg"
          href="https://www.coca-cola.com/"
        />
        <Client label="Cult" src="cult.svg" href="https://cultideas.com/" />
        <Client label="ESPN" src="espn.svg" href="https://www.espn.com/" />
        <Client
          label="Hot Wheels"
          src="hotwheels.svg"
          href="https://hotwheels.mattel.com/"
        />
        <Client label="Intel" src="intel.svg" href="https://www.intel.com" />
        <Client
          label="Monstercat"
          src="monstercat.svg"
          href="https://www.monstercat.com/"
        />
        <Client
          label="Seattle Seahawks"
          src="seahawks.svg"
          href="https://www.seahawks.com/"
        />
        <Client
          label="Spotify"
          src="spotify.svg"
          href="https://www.spotify.com/"
        />
        <Client
          label="Teekay"
          src="teekay.svg"
          href="https://www.teekay.com/"
        />
        <Client
          label="TroyBoi"
          src="troyboi.svg"
          href="https://troyboimusic.com/"
        />
        <Client
          src="uclahealth.svg"
          href="https://www.uclahealth.org/"
          id="ucla"
          label="UCLA Health"
        />
        <Client
          label="Under Armour"
          src="underarmour.svg"
          href="https://www.underarmour.com/"
        />
      </Flow>
    </OurRepSection>
  )
}
