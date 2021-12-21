import styled from "styled-components"

const Static = styled.div`
  position: fixed;
  height: 100vh;
  width: 100vw;
  opacity: 0.3;

  .tv0 {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    position: relative;
    isolation: isolate;
  }

  .tv-static0 {
    position: absolute;
    top: 0px;
    left: 0px;
    margin: auto;
    height: 300%;
    width: 300%;
    animation: anim 1s steps(2, end) infinite both;
    transform: translate3d(0, 0, 0);
    filter: contrast(300%) brightness(50%);
  }

  .tv-static0 svg {
    height: 200%;
    width: 100%;
    transform: scale(2.5);
  }

  @keyframes anim {
    0% {
      transform: translateX(0px, 0px);
    }
    10% {
      transform: translate(-100px, 100px);
    }
    20% {
      transform: translate(150px, -100px);
    }
    30% {
      transform: translate(-100px, 100px);
    }
    40% {
      transform: translate(100px, -150px);
    }
    50% {
      transform: translate(-100px, 200px);
    }
    60% {
      transform: translate(-200px, -100px);
    }
    70% {
      transform: translateY(50px, 100px);
    }
    80% {
      transform: translate(100px, -150px);
    }
    90% {
      transform: translate(0px, 200px);
    }
    100% {
      transform: translate(-100px, 100px);
    }
  }
`

const BackgroundStatic1 = () => {
  return (
    <Static>
      <div className="tv0">
        <div className="tv-static0">
          <svg xmlns="http://www.w3.org/2000/svg">
            <filter id="noiseFilter">
              <feTurbulence
                type="turbulence"
                result="noise"
                baseFrequency="0.7"
                numOctaves="6"
                seed="2"
                stitchTiles="noStitch"
              />
            </filter>

            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </svg>
          <div className="overlay"></div>
        </div>
      </div>
    </Static>
  )
}

export { BackgroundStatic1 }
