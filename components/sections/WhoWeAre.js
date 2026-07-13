import styled from "styled-components"
import WhiteStrokeHeader from "../WhiteStrokeHeader"
import PoppedHeader from "../PoppedHeader"
import { useInView } from "../../utils/useInView"
import { forwardRef } from "react"
import Image from "next/image"

const Section = styled.section`
  position: relative;
  padding: 0;
  height: 100vh;
  height: 100svh;
  margin-top: 20vh;
  margin-bottom: 15vh;
  @media screen and (max-width: 425px) {
    height: 110vh;
    height: 110svh;
    margin-top: 10vh;
    margin-bottom: 10vh;
  }

  .centerframe {
    position: absolute;
    overflow: hidden;
    top: 0;
    left: 0;
    height: 100vh;
    height: 100svh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .graphic {
    @media screen and (max-width: 425px) {
      top: -150px;
    }
  }

  .img {
    position: absolute;
    overflow: hidden;
    height: 100%;
    width: auto;
    transition:
      opacity 700ms ease,
      filter 700ms ease;
    will-change: opacity, filter;
    z-index: 0;
  }
  .hidden {
    opacity: 0.01;
    filter: grayscale(100%) blur(24px);
  }
  .appear {
    opacity: 1;
    filter: grayscale(0%) blur(0);
  }

  .textpos {
    margin: 1em;
    margin-bottom: 5%;
    margin-top: auto;
    transition:
      opacity 700ms ease 150ms,
      filter 700ms ease 150ms;

    @media screen and (min-width: 425px) {
      margin-left: 10em;
      margin-right: 10em;
    }
  }
`

const WhoWeAre = forwardRef(({ content }, ref) => {
  const { ref: refAnimation, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  })

  return (
    <Section id="about" ref={ref}>
      <div className="centerframe graphic" ref={refAnimation}>
        <Image
          src="/images/TAGG_webbanner5.png"
          id="logo"
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1920}
          height={1080}
          sizes="(max-width: 425px) 180vh, 180vh"
          quality={65}
          className={inView ? "img appear" : "img hidden"}
        />
        <WhiteStrokeHeader
          style={{ transform: "translate(-5%, -80%)" }}
          inView={inView}
        >
          Who
        </WhiteStrokeHeader>
        <WhiteStrokeHeader
          style={{ transform: "translate(0%, 0%)" }}
          inView={inView}
        >
          We
        </WhiteStrokeHeader>
        <WhiteStrokeHeader
          style={{ transform: "translate(25%, 80%)" }}
          inView={inView}
        >
          Are
        </WhiteStrokeHeader>
      </div>

      <div className="centerframe">
        <div className={inView ? "textpos appear" : "textpos hidden"}>
          <PoppedHeader>{content.eyebrow}</PoppedHeader>
          <p>
            {content.paragraphs.map((paragraph, index) => (
              <span key={paragraph}>
                {index > 0 && (
                  <>
                    <br />
                    <br />
                  </>
                )}
                {paragraph}
              </span>
            ))}
          </p>
        </div>
      </div>
    </Section>
  )
})

WhoWeAre.displayName = "WhoWeAre"

export default WhoWeAre
