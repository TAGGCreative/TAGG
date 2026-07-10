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
import { getMediaCatalog } from "../lib/mediaCatalog"
import { useInView } from "../utils/useInView"
import { BackgroundStatic1 } from "../components/elements/BackgroundStatic1"

export function getStaticProps() {
  const catalog = getMediaCatalog()

  return {
    props: {
      videoList: catalog.works,
      clipsMobile: catalog.carousels.mobile,
      clipsDesktop: catalog.carousels.desktop,
      cloudflareCustomerCode: catalog.cloudflare?.customerCode || "",
    },
  }
}

export default function Home({
  videoList,
  clipsMobile,
  clipsDesktop,
  cloudflareCustomerCode,
}) {
  // Nav targeting
  const { ref: refCarousel, inView: inViewCarousel } = useInView()
  const { ref: refWorks, inView: inViewWorks } = useInView()
  const { ref: refPeople, inView: inViewPeople } = useInView({
    threshold: 0.25,
  })
  const { ref: refContact, inView: inViewContact } = useInView({
    threshold: 0.25,
  })

  return (
    <>
      <NavBar
        visibleSection={
          inViewCarousel || inViewWorks
            ? "works"
            : inViewPeople
              ? "people"
              : inViewContact
                ? "contact"
                : "about"
        }
      />
      <main>
        <h1 className="sr-only">TAGG Creative — Vancouver production studio</h1>
        <BackgroundStatic1 />
        <Carousel
          clipsDesktop={clipsDesktop}
          clipsMobile={clipsMobile}
          cloudflareCustomerCode={cloudflareCustomerCode}
          ref={refCarousel}
        />
        <WhoWeAre id="about" />
        <Core id="core" />
        <OurArena id="our-arena" />
        <Works videoList={videoList} id="works" ref={refWorks} />
        <People id="people" ref={refPeople} />
        <TheFam id="the-fam" />
        <OurRep id="our-rep" />
        <Contact id="contact" ref={refContact} />
        <PrivacyPolicy />
      </main>
    </>
  )
}
