import HomeSection from "./HomeSection"
import Link from "next/link"
import styled from "styled-components"
import WorkThumb from "../WorkThumb"
import { AnimatedHeader } from "../elements/AnimatedHeader"
import { forwardRef } from "react"
import PoppedHeader from "../PoppedHeader"
import { useMediaQuery } from "react-responsive"

const WorksBox = styled.div`
  display: grid;
  width: 100%;
  margin: 0 auto;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 4%;
  row-gap: 1em;

  & > div {
    width: 100%;
    &:not(:first-child) {
      margin-top: ${({ marginTop }) => marginTop};
    }
  }

  & > :nth-child(odd) {
    justify-self: end;
  }

  & > :nth-child(even) {
    justify-self: start;
  }

  @media screen and (max-width: 425px) {
    display: block;
    width: 95%;
    margin-bottom: 2em;
    & > div {
      margin-top: 0;
      margin-bottom: 0;
    }
  }
`

const Work = styled.div`
  display: initial;
  min-height: fit-content;
  cursor: pointer;
  max-width: 100%;

  & h2 {
    margin: 0;
    margin-top: 1em;
    font-size: 1.3em;
    transition: text-shadow 0.2s ease-in-out;
  }

  & p {
    margin: 0;
  }

  &:hover {
    h2 {
      text-shadow: -0.1em 0.1em var(--red);
    }

    .image {
      opacity: 0;
    }

    .gif {
      opacity: 1;
    }
  }

  @media screen and (max-width: 425px) {
    & p {
      margin-bottom: 2em;
    }

    & h2 {
      margin-top: 0.5em;
    }
  }
`

const Works = forwardRef(({ videoList }, ref) => {
  const isMobile = useMediaQuery({ query: "(max-width: 425px)" })
  return (
    <HomeSection
      id="works"
      ref={ref}
      sectionStyle={{ marginTop: isMobile ? 0 : "15vh" }}
      HeaderComponent={() => (
        <AnimatedHeader id="works-header">
          <svg
            width="814.001"
            height="144.804"
            viewBox="0 0 814.001 144.804"
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
                d="M 192.8 2.402 L 223.8 2.402 L 178 142.402 L 143.2 142.402 L 112.4 47.602 L 80.6 142.402 L 46 142.402 L 0 2.402 L 33.6 2.402 L 65.2 100.802 L 98.2 2.402 L 128.2 2.402 L 160.2 101.602 L 192.8 2.402 Z"
                id="0"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 288.228 141.488 A 87.119 87.119 0 0 0 312.6 144.802 A 95.761 95.761 0 0 0 320.62 144.471 A 78.704 78.704 0 0 0 351.8 135.402 Q 369.2 126.002 379.2 109.502 A 67.764 67.764 0 0 0 384.79 97.953 A 72.799 72.799 0 0 0 389.2 72.402 A 83.332 83.332 0 0 0 389.161 69.843 A 69.59 69.59 0 0 0 379.2 35.302 Q 369.2 18.802 351.8 9.402 A 75.614 75.614 0 0 0 336.861 3.294 A 86.783 86.783 0 0 0 312.6 0.002 A 96.294 96.294 0 0 0 305.233 0.28 A 79.543 79.543 0 0 0 273.3 9.402 Q 255.8 18.802 245.9 35.302 Q 236 51.802 236 72.402 Q 236 93.002 245.9 109.502 Q 255.8 126.002 273.3 135.402 A 76.452 76.452 0 0 0 288.228 141.488 Z M 312.6 117.202 A 46.411 46.411 0 0 0 327.672 114.805 A 42.37 42.37 0 0 0 335 111.502 Q 345 105.802 350.7 95.602 A 44.991 44.991 0 0 0 356.127 77.955 A 55.434 55.434 0 0 0 356.4 72.402 A 50.649 50.649 0 0 0 354.596 58.663 A 43.309 43.309 0 0 0 350.7 49.202 Q 345 39.002 335 33.302 Q 325 27.602 312.6 27.602 A 46.411 46.411 0 0 0 297.528 29.999 A 42.37 42.37 0 0 0 290.2 33.302 Q 280.2 39.002 274.5 49.202 A 44.991 44.991 0 0 0 269.073 66.848 A 55.434 55.434 0 0 0 268.8 72.402 A 50.649 50.649 0 0 0 270.604 86.141 A 43.309 43.309 0 0 0 274.5 95.602 Q 280.2 105.802 290.2 111.502 Q 300.2 117.202 312.6 117.202 Z"
                id="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 537.6 142.402 L 502.8 142.402 L 475.8 103.402 L 474.2 103.402 L 446 103.402 L 446 142.402 L 413.6 142.402 L 413.6 2.402 L 474.2 2.402 A 94.323 94.323 0 0 1 489.537 3.589 Q 498.794 5.114 506.5 8.602 A 52.244 52.244 0 0 1 519.44 16.797 A 44.895 44.895 0 0 1 527.6 26.202 A 45.653 45.653 0 0 1 534.447 44.985 A 59.229 59.229 0 0 1 535 53.202 A 54.454 54.454 0 0 1 533.352 66.882 A 43.364 43.364 0 0 1 527.5 80.102 A 45.971 45.971 0 0 1 511.154 94.966 A 57.534 57.534 0 0 1 506.2 97.402 L 537.6 142.402 Z M 472.4 28.802 L 446 28.802 L 446 77.602 L 472.4 77.602 A 53.254 53.254 0 0 0 480.793 76.985 Q 485.077 76.3 488.528 74.854 A 23.354 23.354 0 0 0 494.6 71.202 A 20.869 20.869 0 0 0 501.823 58.11 A 30.671 30.671 0 0 0 502.2 53.202 A 29.228 29.228 0 0 0 501.302 45.739 A 20.105 20.105 0 0 0 494.6 35.102 A 24.456 24.456 0 0 0 486.61 30.795 Q 480.613 28.802 472.4 28.802 Z"
                id="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 656.4 142.402 L 611.6 87.402 L 592.8 107.002 L 592.8 142.402 L 560.6 142.402 L 560.6 2.402 L 592.8 2.402 L 592.8 67.802 L 654.8 2.402 L 690.8 2.402 L 632.8 64.802 L 694.2 142.402 L 656.4 142.402 Z"
                id="3"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 697.6 128.602 L 708.6 104.202 A 68.346 68.346 0 0 0 721.091 111.397 A 87.007 87.007 0 0 0 730 114.802 Q 742.4 118.802 754.8 118.802 A 74.073 74.073 0 0 0 761.993 118.478 Q 769.2 117.772 773.71 115.53 A 18.038 18.038 0 0 0 775.2 114.702 A 16.372 16.372 0 0 0 778.786 111.76 A 11.528 11.528 0 0 0 781.8 103.802 Q 781.8 98.802 777.9 95.502 A 25.058 25.058 0 0 0 773.293 92.444 Q 770.855 91.171 767.9 90.202 A 114.936 114.936 0 0 0 763.668 88.913 Q 758.89 87.549 752.341 86.02 A 383.998 383.998 0 0 0 751.4 85.802 A 333.22 333.22 0 0 1 740.649 83.071 Q 735.635 81.701 731.373 80.332 A 143.343 143.343 0 0 1 725.2 78.202 Q 715 74.402 707.7 66.002 Q 700.4 57.602 700.4 43.602 Q 700.4 31.402 707 21.502 A 39.485 39.485 0 0 1 717.532 10.959 A 55.012 55.012 0 0 1 726.9 5.802 A 64.966 64.966 0 0 1 740.665 1.639 Q 747.066 0.411 754.404 0.104 A 119.569 119.569 0 0 1 759.4 0.002 Q 772.8 0.002 785.6 3.202 Q 798.4 6.402 808 12.402 L 798 37.002 Q 778.6 26.002 759.2 26.002 A 67.073 67.073 0 0 0 752.112 26.35 Q 744.86 27.123 740.381 29.615 A 17.229 17.229 0 0 0 739.1 30.402 A 16.345 16.345 0 0 0 735.284 33.905 A 12.858 12.858 0 0 0 732.6 42.002 A 10.554 10.554 0 0 0 736.775 50.686 A 16.662 16.662 0 0 0 740.1 52.702 A 56.317 56.317 0 0 0 744.944 54.663 Q 751.931 57.158 763 59.602 A 333.22 333.22 0 0 1 773.751 62.333 Q 778.765 63.703 783.027 65.072 A 143.343 143.343 0 0 1 789.2 67.202 Q 799.4 71.002 806.7 79.202 Q 814 87.402 814 101.402 Q 814 113.402 807.3 123.302 Q 800.6 133.202 787.2 139.002 A 65.901 65.901 0 0 1 773.363 143.165 Q 766.673 144.444 758.984 144.724 A 120.599 120.599 0 0 1 754.6 144.802 Q 738 144.802 722.5 140.302 Q 710.33 136.769 701.921 131.571 A 52.434 52.434 0 0 1 697.6 128.602 Z"
                id="4"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(10px)" }}
              />
            </g>
          </svg>
        </AnimatedHeader>
      )}
    >
      <WorksBox marginTop="-100px">
        {videoList.map((video, i) => {
          const videoId = video.uri.split("/")[2]
          try {
            const desc = JSON.parse(video.description)
            return (
              <Link href="/works/[videoId]" as={`/works/${videoId}`} key={i}>
                <Work key={i}>
                  <WorkThumb
                    images={video.pictures.sizes}
                    thumb={video?.thumb}
                    key={i}
                  />
                  <PoppedHeader className="works-client" noShadow>
                    {desc?.client ?? desc?.Client}
                  </PoppedHeader>
                  <p>{desc?.title ?? desc?.Title}</p>
                </Work>
              </Link>
            )
          } catch (error) {
            console.log("WORKS Problem with video named: ", video.name)
            console.error(error)
            return null
          }
        })}
      </WorksBox>
    </HomeSection>
  )
})

export default Works
