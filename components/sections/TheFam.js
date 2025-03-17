import HomeSection from "./HomeSection"
import RosterCard from "../RosterCard"
import { StaggerBox } from "../elements/StaggerBox"
import { AnimatedHeader } from "../elements/AnimatedHeader"
import { useMediaQuery } from "react-responsive"

const team = {
  extended: [
    {
      head: "/images/extended-fam/ExtendedFam_Baylee.png",
      mask: "/images/extended-fam/ExtendedFam_Baylee copy.png",
      given: "BAYLEE",
      sur: "SINNER",
      role: "Director / Producer",
      bio: "A creative power house with a serious knack for documentary storytelling. No matter what she's working on—Baylee's bubbly charisma is ever present, resulting in serious laughs and big time grins. Oh, and she's now an Honorary Canadian after rocking that tuxedo.",
    },
    {
      head: "/images/extended-fam/ExtendedFam_JeffZwicker-DirectorOfPhotography.png",
      mask: "/images/extended-fam/ExtendedFam_JeffZwicker-DirectorOfPhotography copy.png",
      given: "JEFF",
      sur: "ZWICKER",
      role: "Cinematographer",
      bio: "Put him in any room, any location, under any amount of pressure, and this man will light it beautifully. He's also got a mean Jiu Jitsu take down.",
    },
    {
      head: "/images/extended-fam/TAGG-WEB-TeamPhotos-Pink-Hein-.png",
      mask: "images/extended-fam/TAGG-WEB-TeamPhotos-Pink-Hein-copy.png",
      given: "HEIN",
      sur: "HAMERS",
      role: "Visual Artist",
      bio: "It’s not everyday that you meet a professional who perfectly blends technical prowess and unbridled creativity, but Hein is certainly one of them. He’s Multi-disciplined, inventive, cerebral, but most importantly; he  takes our ideas, places them beautifully in the VFX realm and pushes them beyond our imagination.",
    },
  ],
}

export default function TheFam() {
  const isMobile = useMediaQuery({ query: "(max-width: 425px)" })
  return (
    <HomeSection
      id="the-fam"
      header="the family"
      sectionStyle={{ marginTop: isMobile ? 0 : "-10vh" }}
      HeaderComponent={() => (
        <AnimatedHeader id="the-fam-header">
          <svg
            width="924.8"
            height="140"
            viewBox="0 0 924.8 140"
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
                d="M 44.8 140 L 44.8 26.4 L 0 26.4 L 0 0 L 122 0 L 122 26.4 L 77.2 26.4 L 77.2 140 L 44.8 140 Z"
                id="0"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(-5px)" }}
              />
              <path
                d="M 235.4 0 L 267.8 0 L 267.8 140 L 235.4 140 L 235.4 82.6 L 171.8 82.6 L 171.8 140 L 139.4 140 L 139.4 0 L 171.8 0 L 171.8 55.2 L 235.4 55.2 L 235.4 0 Z"
                id="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 333.2 114 L 409.4 114 L 409.4 140 L 301 140 L 301 0 L 406.8 0 L 406.8 26 L 333.2 26 L 333.2 56.4 L 398.2 56.4 L 398.2 81.6 L 333.2 81.6 L 333.2 114 Z"
                id="2"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(-7px)" }}
              />
              <path
                d="M 597.6 26 L 524.2 26 L 524.2 63 L 589 63 L 589 89 L 524.2 89 L 524.2 140 L 491.8 140 L 491.8 0 L 597.6 0 L 597.6 26 Z"
                id="4"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 718.4 140 L 706 110 L 641 110 L 628.6 140 L 595.4 140 L 657.8 0 L 689.8 0 L 752.4 140 L 718.4 140 Z M 651.4 85.4 L 695.8 85.4 L 673.6 31.8 L 651.4 85.4 Z"
                id="5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 924.8 140 L 894.4 140 L 894.2 56 L 853 125.2 L 838.4 125.2 L 797.4 57.8 L 797.4 140 L 767 140 L 767 0 L 793.8 0 L 846.2 87 L 897.8 0 L 924.4 0 L 924.8 140 Z"
                id="6"
                vectorEffect="non-scaling-stroke"
                style={{ transform: "translateX(5px)" }}
              />
            </g>
          </svg>
        </AnimatedHeader>
      )}
    >
      <StaggerBox marginTop="-250px">
        {team.extended.map(
          ({ given, sur, role, company, bio, head, mask }, i) => (
            <RosterCard
              given={given}
              sur={sur}
              role={role}
              company={company}
              bio={bio}
              head={head}
              mask={mask}
              key={i}
            />
          ),
        )}
      </StaggerBox>
    </HomeSection>
  )
}
