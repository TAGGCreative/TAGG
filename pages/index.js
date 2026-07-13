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
import { getSiteContent } from "../lib/siteContent"
import { useInView } from "../utils/useInView"
import { BackgroundStatic1 } from "../components/elements/BackgroundStatic1"
import Link from "next/link"

export async function getStaticProps({ preview = false, previewData = {} }) {
  const content = await getSiteContent({
    previewToken: preview ? previewData?.token : undefined,
  })
  const catalog = content.media
  const visibleWorks = catalog.works.filter(
    (project) => project.visible !== false,
  )
  const hiddenIds = new Set(
    catalog.works
      .filter((project) => project.visible === false)
      .map((project) => project.id),
  )
  const carouselOrder = new Map(
    (catalog.carouselOrder || []).map((projectId, index) => [projectId, index]),
  )
  const orderedCarousel = (format) =>
    [...catalog.carousels[format]]
      .filter((clip) => !hiddenIds.has(clip.projectId))
      .sort(
        (a, b) =>
          (carouselOrder.get(a.projectId) ?? Number.MAX_SAFE_INTEGER) -
          (carouselOrder.get(b.projectId) ?? Number.MAX_SAFE_INTEGER),
      )

  return {
    props: {
      videoList: visibleWorks,
      clipsMobile: orderedCarousel("mobile"),
      clipsDesktop: orderedCarousel("desktop"),
      cloudflareCustomerCode: catalog.cloudflare?.customerCode || "",
      editorial: content.editorial,
      isPreview: preview,
    },
    revalidate: preview ? 1 : 60,
  }
}

export default function Home({
  videoList,
  clipsMobile,
  clipsDesktop,
  cloudflareCustomerCode,
  editorial,
  isPreview,
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
        {isPreview && (
          <div className="cms-preview-banner">
            TAGG CMS preview
            <Link href="/api/cms-exit-preview">Exit preview</Link>
          </div>
        )}
        <h1 className="sr-only">TAGG Creative — Vancouver production studio</h1>
        <BackgroundStatic1 />
        <Carousel
          clipsDesktop={clipsDesktop}
          clipsMobile={clipsMobile}
          cloudflareCustomerCode={cloudflareCustomerCode}
          ref={refCarousel}
        />
        <WhoWeAre id="about" content={editorial.sections.whoWeAre} />
        <Core id="core" items={editorial.sections.core} />
        <OurArena id="our-arena" items={editorial.sections.ourArena} />
        <Works videoList={videoList} id="works" ref={refWorks} />
        <People
          id="people"
          people={editorial.people.leadership}
          ref={refPeople}
        />
        <TheFam id="the-fam" people={editorial.people.extended} />
        <OurRep id="our-rep" />
        <Contact id="contact" contact={editorial.contact} ref={refContact} />
        <PrivacyPolicy />
      </main>
    </>
  )
}
