import styled from "styled-components"
import WhiteStrokeHeader from "../WhiteStrokeHeader"
import PoppedHeader from "../PoppedHeader"
import { useInView } from "react-intersection-observer"
import { forwardRef } from "react"

const Section = styled.section`
  position: relative;
  padding: 0;
  height: 100vh;
  margin-bottom: 5vh;

  .centerframe {
    position: absolute;
    overflow: hidden;
    top: 0;
    left: 0;
    height: 100vh;
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
    transition: all 1000ms ease-in;
    z-index: 0;
  }
  .hidden {
    opacity: 0.01;
    filter: grayscale(100%);
    filter: blur(100%);
  }
  .appear {
    opacity: 1;
    filter: grayscale(0%);
    filter: blur(0%);
  }

  .textpos {
    margin: 1em;
    margin-bottom: 5%;
    margin-top: auto;
    transition: all 1.5s ease-in 0.3s;

    @media screen and (min-width: 426px) {
      margin-left: 10em;
      margin-right: 10em;
    }
  }
`

const WhoWeAre = forwardRef((props, ref) => {
  const {
    ref: refAnimation,
    inView,
    entry,
  } = useInView({
    threshold: 0.5,
    // triggerOnce: true,
  })

  return (
    <Section id="about" ref={ref}>
      <div className="centerframe graphic" ref={refAnimation}>
        <img
          src="/images/TAGG_webbanner5.png"
          id="logo"
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
          <PoppedHeader>A VIDEO-FIRST CREATIVE AGENCY</PoppedHeader>
          <p>
            We solve creative problems with video. It’s not an afterthought,
            it’s not the cherry on top, it’s the whole motherf%^$ing sundae. It
            doesn’t matter whether that’s a slick TVC spot, a docu-style brand
            story, or a UGC campaign shot exclusively on iPhone. No tool, style,
            or deliverable is out of the picture.
          </p>
        </div>
      </div>
    </Section>
  )
})

export default WhoWeAre
