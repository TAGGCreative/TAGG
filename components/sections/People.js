import HomeSection from "./HomeSection"
import RosterCard from "../RosterCard"
import { AnimatedHeader } from "../elements/AnimatedHeader"
import { StaggerBox } from "../elements/StaggerBox"
import { css } from "styled-components"
import styled from "styled-components"

const PeopleStaggerBox = styled(StaggerBox)`
  & > div:nth-child(2) {
    margin-top: -8em !important;
    transform: translateY(-2em);
  }
`

const leadership = [
  {
    given: "TROY ADAM",
    sur: "GORDON",
    role: "CEO, Executive Producer",
    head: "/images/leadership/Leadership_TroyAdamGordon -CEO.png",
    mask: "/images/leadership/Leadership_TroyAdamGordon -CEO copy.png",
    bio: "He has over 20K hours of production and post experience under his belt, accumulated over 20M  organic views on content he's produced, worked  with Grammy award winning artists, cult brands, and still unapologetically wastes countless hours watching cat videos.",
  },
  {
    given: "ZAQIR",
    sur: "VIRANI",
    role: "Strategic Advisor",
    head: "/images/leadership/Leadership_ZaqirVirani - Advisor.png",
    mask: "/images/leadership/Leadership_ZaqirVirani - Advisor copy.png",
    bio: "An executive leader in business development and growth strategy, Zaqir preaches narrative-driven engagement strategies and systems thinking. In his work as an advisor to TAGG Creative, Zaqir consults on all things growth—from sales strategies to messaging, and from tactical engagement to business development.",
  },
]

export default function People() {
  return (
    <HomeSection
      id="people"
      header="people"
      HeaderComponent={() => (
        <AnimatedHeader id="people-header">
          <svg
            width="825"
            height="144.804"
            viewBox="0 0 825 144.804"
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
                d="M 60.6 103.802 L 32.4 103.802 L 32.4 142.402 L 0 142.402 L 0 2.402 L 60.6 2.402 A 94.323 94.323 0 0 1 75.937 3.589 Q 85.194 5.114 92.9 8.602 A 52.244 52.244 0 0 1 105.84 16.797 A 44.895 44.895 0 0 1 114 26.202 A 45.653 45.653 0 0 1 120.847 44.985 A 59.229 59.229 0 0 1 121.4 53.202 A 54.074 54.074 0 0 1 119.492 67.837 A 44.904 44.904 0 0 1 114 80.102 A 45.93 45.93 0 0 1 97.027 95.664 A 56.886 56.886 0 0 1 92.9 97.702 A 67.859 67.859 0 0 1 76.961 102.462 Q 69.796 103.718 61.686 103.797 A 112.127 112.127 0 0 1 60.6 103.802 Z M 58.8 28.802 L 32.4 28.802 L 32.4 77.402 L 58.8 77.402 A 54.159 54.159 0 0 0 67.144 76.802 Q 75.745 75.458 81 71.102 A 20.484 20.484 0 0 0 88.183 58.348 A 30.355 30.355 0 0 0 88.6 53.202 A 29.228 29.228 0 0 0 87.702 45.739 A 20.105 20.105 0 0 0 81 35.102 A 24.456 24.456 0 0 0 73.01 30.795 Q 67.012 28.802 58.8 28.802 Z"
                id="0"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 178.6 116.402 L 254.8 116.402 L 254.8 142.402 L 146.4 142.402 L 146.4 2.402 L 252.2 2.402 L 252.2 28.402 L 178.6 28.402 L 178.6 58.802 L 243.6 58.802 L 243.6 84.002 L 178.6 84.002 L 178.6 116.402 Z"
                id="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 324.028 141.488 A 87.119 87.119 0 0 0 348.4 144.802 A 95.761 95.761 0 0 0 356.42 144.471 A 78.704 78.704 0 0 0 387.6 135.402 Q 405 126.002 415 109.502 A 67.764 67.764 0 0 0 420.59 97.953 A 72.799 72.799 0 0 0 425 72.402 A 83.332 83.332 0 0 0 424.961 69.843 A 69.59 69.59 0 0 0 415 35.302 Q 405 18.802 387.6 9.402 A 75.614 75.614 0 0 0 372.661 3.294 A 86.783 86.783 0 0 0 348.4 0.002 A 96.294 96.294 0 0 0 341.033 0.28 A 79.543 79.543 0 0 0 309.1 9.402 Q 291.6 18.802 281.7 35.302 Q 271.8 51.802 271.8 72.402 Q 271.8 93.002 281.7 109.502 Q 291.6 126.002 309.1 135.402 A 76.452 76.452 0 0 0 324.028 141.488 Z M 348.4 117.202 A 46.411 46.411 0 0 0 363.472 114.805 A 42.37 42.37 0 0 0 370.8 111.502 Q 380.8 105.802 386.5 95.602 A 44.991 44.991 0 0 0 391.927 77.955 A 55.434 55.434 0 0 0 392.2 72.402 A 50.649 50.649 0 0 0 390.396 58.663 A 43.309 43.309 0 0 0 386.5 49.202 Q 380.8 39.002 370.8 33.302 Q 360.8 27.602 348.4 27.602 A 46.411 46.411 0 0 0 333.328 29.999 A 42.37 42.37 0 0 0 326 33.302 Q 316 39.002 310.3 49.202 A 44.991 44.991 0 0 0 304.873 66.848 A 55.434 55.434 0 0 0 304.6 72.402 A 50.649 50.649 0 0 0 306.404 86.141 A 43.309 43.309 0 0 0 310.3 95.602 Q 316 105.802 326 111.502 Q 336 117.202 348.4 117.202 Z"
                id="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 510 103.802 L 481.8 103.802 L 481.8 142.402 L 449.4 142.402 L 449.4 2.402 L 510 2.402 A 94.323 94.323 0 0 1 525.337 3.589 Q 534.594 5.114 542.3 8.602 A 52.244 52.244 0 0 1 555.24 16.797 A 44.895 44.895 0 0 1 563.4 26.202 A 45.653 45.653 0 0 1 570.247 44.985 A 59.229 59.229 0 0 1 570.8 53.202 A 54.074 54.074 0 0 1 568.892 67.837 A 44.904 44.904 0 0 1 563.4 80.102 A 45.93 45.93 0 0 1 546.427 95.664 A 56.886 56.886 0 0 1 542.3 97.702 A 67.859 67.859 0 0 1 526.361 102.462 Q 519.196 103.718 511.086 103.797 A 112.127 112.127 0 0 1 510 103.802 Z M 508.2 28.802 L 481.8 28.802 L 481.8 77.402 L 508.2 77.402 A 54.159 54.159 0 0 0 516.544 76.802 Q 525.145 75.458 530.4 71.102 A 20.484 20.484 0 0 0 537.583 58.348 A 30.355 30.355 0 0 0 538 53.202 A 29.228 29.228 0 0 0 537.102 45.739 A 20.105 20.105 0 0 0 530.4 35.102 A 24.456 24.456 0 0 0 522.41 30.795 Q 516.413 28.802 508.2 28.802 Z"
                id="3"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 595.8 142.402 L 595.8 2.402 L 628.2 2.402 L 628.2 116.002 L 698.4 116.002 L 698.4 142.402 L 595.8 142.402 Z"
                id="4"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 748.8 116.402 L 825 116.402 L 825 142.402 L 716.6 142.402 L 716.6 2.402 L 822.4 2.402 L 822.4 28.402 L 748.8 28.402 L 748.8 58.802 L 813.8 58.802 L 813.8 84.002 L 748.8 84.002 L 748.8 116.402 Z"
                id="5"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>
        </AnimatedHeader>
      )}
    >
      <PeopleStaggerBox>
        {leadership.map(({ given, sur, role, bio, head, mask }, i) => (
          <RosterCard
            given={given}
            sur={sur}
            role={role}
            bio={bio}
            head={head}
            mask={mask}
            key={i}
          />
        ))}
      </PeopleStaggerBox>
    </HomeSection>
  )
}
