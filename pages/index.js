import { NavBar } from "../components/NavBar"
import Carousel from "../components/sections/Carousel"
import Works from "../components/sections/Works"
import WhoWeAre from "../components/sections/WhoWeAre"
import Core from "../components/sections/Core"
import OurArena from "../components/sections/OurArena"
import People from "../components/sections/People"
import TheFam from "../components/sections/TheFam"
import OurRep from "../components/sections/OurRep"
import Contact from "../components/sections/Contact"
import { PrivacyPolicy } from "../components/elements/PrivacyPolicy"
import {
  getPreviewVideo,
  getClipsMobile,
  getClipsDesktop,
  getWorks,
} from "../vimeo"
import { useInView } from "react-intersection-observer"
import { BackgroundStatic1 } from "../components/elements/BackgroundStatic1"

// Fetch all video content
export async function getStaticProps(context) {
  const clipsMobile = await getClipsMobile()
  const clipsDesktop = await getClipsDesktop()

  let videoList = await getWorks()
  for (let video of videoList) {
    video["thumb"] = await getPreviewVideo(video?.uri)
  }

  return {
    props: { videoList, clipsMobile, clipsDesktop },
    revalidate: 60, // seconds before the site updates after Vimeo content changes
  }
}

export default function Home({ videoList, clipsMobile, clipsDesktop }) {
  // Nav targeting
  const { ref: refCarousel, inView: inViewCarousel } = useInView()
  const { ref: refWorks, inView: inViewWorks } = useInView()
  const { ref: refContact, inView: inViewContact } = useInView({
    threshold: 0.25,
  })

  return (
    <>
      <NavBar
        visibleSection={
          inViewCarousel || inViewWorks
            ? "works"
            : inViewContact
            ? "contact"
            : "about"
        }
      />
      <main>
        <BackgroundStatic1 />
        <Carousel
          clipsDesktop={clipsDesktop}
          clipsMobile={clipsMobile}
          ref={refCarousel}
        />
        <Works videoList={videoList} id="works" ref={refWorks} />
        <WhoWeAre id="about" />
        <Core id="core" />
        <OurArena id="our-arena" />
        <People id="people" />
        <TheFam id="the-fam" />
        <OurRep id="our-rep" />
        <Contact id="contact" ref={refContact} />
        <PrivacyPolicy />
      </main>
    </>
  )
}
