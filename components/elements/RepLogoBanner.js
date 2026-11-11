import Image from "next/image"
import styled from "styled-components"

const rows = [
  [
    ["Microsoft", "microsoft.png", "https://www.microsoft.com/"],
    ["NBA", "nba.svg", "https://www.nba.com/"],
    ["Sunoco", "sunoco.png", "https://www.sunocolp.com/"],
    ["Amazon", "amazon.svg", "https://www.amazon.com/"],
    ["LUNR Aerospace", "lunr-aerospace.png", "https://lunrcorp.com/"],
    [
      "Skilled Trades College",
      "skilled-trades.png",
      "https://www.skilledtradescollege.ca/",
    ],
    ["Coca-Cola", "cocacola.svg", "https://www.coca-cola.com/"],
    ["Brave", "brave.png", "https://brave.com/"],
    ["Seattle Seahawks", "seahawks.svg", "https://www.seahawks.com/"],
  ],
  [
    ["Perfect Sports", "perfect-sports.png", "https://perfectsports.com/"],
    ["ESPN", "espn.svg", "https://www.espn.com/"],
    ["Doritos", "doritos.png", "https://www.doritos.com/"],
    ["Redwood AI", "redwood-ai.png", "https://redwoodai.com/"],
    ["Amazon Business", "amazon-business.png", "https://business.amazon.com/"],
    ["Under Armour", "underarmour.svg", "https://www.underarmour.com/"],
    ["Zappos", "zappos.svg", "https://www.zappos.com/"],
    ["TroyBoi", "troyboi.png", "https://troyboimusic.com/"],
    ["Teekay", "teekay.svg", "https://www.teekay.com/"],
  ],
  [
    ["The Leukemia & Lymphoma Society", "lls.png", "https://www.lls.org/"],
    ["Chevron", "chevron.svg", "https://www.chevron.com/"],
    ["AWS", "aws.png", "https://aws.amazon.com/"],
    ["Spotify", "spotify.svg", "https://www.spotify.com/"],
    ["Intel", "intel.svg", "https://www.intel.com/"],
    ["Hot Wheels", "hotwheels.svg", "https://hotwheels.mattel.com/"],
    ["LIR Life Sciences", "lir-life-sciences.png", "https://lirlife.com/"],
    ["Cult", "cult.svg", "https://cultideas.com/"],
  ],
]

const dimensions = {
  "amazon-business.png": [480, 89],
  "amazon.png": [480, 146],
  "aws.png": [367, 220],
  "brave.png": [480, 150],
  "chevron.png": [197, 220],
  "cocacola.png": [480, 157],
  "cult.png": [446, 123],
  // White knockout adapted from commons.wikimedia.org/wiki/File:Logo_Doritos.png (CC BY 4.0).
  "doritos.png": [288, 220],
  "espn.png": [480, 119],
  "hotwheels.png": [480, 135],
  "intel.png": [333, 220],
  "lir-life-sciences.png": [480, 68],
  "lls.png": [467, 220],
  "lunr-aerospace.png": [480, 154],
  "microsoft.png": [480, 102],
  "nba.png": [374, 220],
  "perfect-sports.png": [480, 104],
  "redwood-ai.png": [480, 60],
  "seahawks.png": [480, 190],
  "skilled-trades.png": [480, 153],
  "spotify.png": [480, 145],
  "teekay.png": [480, 138],
  "sunoco.png": [480, 62],
  "troyboi.png": [480, 126],
  "underarmour.png": [369, 215],
  "zappos.png": [480, 120],
}

const Banner = styled.div`
  --logo-gap: clamp(1.25rem, 2.7vw, 2.65rem);
  --max-mark-width: clamp(8.1rem, 14vw, 13.25rem);
  container-type: inline-size;
  position: relative;
  max-width: 110rem;
  margin: 0 auto;
  padding: clamp(2.75rem, 5vw, 4.5rem) 0 1rem;

  @keyframes rep-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-25%);
    }
  }

  .rep-row {
    overflow: hidden;
    mask-image: linear-gradient(
      90deg,
      transparent,
      black 5%,
      black 95%,
      transparent
    );
  }

  .rep-track {
    display: flex;
    width: max-content;
    animation: rep-scroll 44s linear infinite;
  }

  .rep-row:nth-child(even) .rep-track {
    animation-direction: reverse;
    animation-duration: 48s;
  }

  .rep-row:nth-child(3) .rep-track {
    animation-duration: 40s;
  }

  .rep-row:hover .rep-track {
    animation-play-state: paused;
  }

  .rep-group {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    /* Keep the next copy offscreen until the previous mark has cleared. */
    min-width: calc(100cqw + var(--max-mark-width) + var(--logo-gap));
    gap: var(--logo-gap);
    padding-inline-end: var(--logo-gap);
  }

  .rep-logo {
    display: grid;
    place-items: center;
    flex: none;
    min-height: clamp(4.5rem, 7vw, 6.6rem);
    color: white;
  }

  .rep-logo img {
    --mark-height: clamp(2.1rem, 3.55vw, 3.45rem);
    width: min(
      calc(var(--mark-height) * var(--mark-ratio)),
      var(--max-mark-width)
    );
    height: auto;
    transition: filter 160ms ease;
  }

  .rep-logo[data-brand="Chevron"] img,
  .rep-logo[data-brand="Doritos"] img,
  .rep-logo[data-brand="The Leukemia & Lymphoma Society"] img,
  .rep-logo[data-brand="Under Armour"] img,
  .rep-logo[data-brand="Intel"] img,
  .rep-logo[data-brand="NBA"] img {
    --mark-height: clamp(2.5rem, 4vw, 3.7rem);
  }

  .rep-logo:hover img,
  .rep-logo:focus-visible img {
    filter: drop-shadow(-3px 3px var(--red));
  }

  .rep-row:has(.rep-logo:focus-visible) {
    mask-image: none;
  }

  .rep-row:has(.rep-logo:focus-visible) .rep-track {
    width: 100%;
    animation: none;
  }

  .rep-row:has(.rep-logo:focus-visible) .rep-group {
    min-width: 0;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  .rep-row:has(.rep-logo:focus-visible) .rep-repeat {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .rep-row {
      mask-image: none;
    }
    .rep-track {
      width: 100%;
      animation: none;
    }
    .rep-group {
      min-width: 0;
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
    }
    .rep-repeat {
      display: none;
    }
  }
`

export default function RepLogoBanner() {
  return (
    <Banner>
      {rows.map((logos, index) => (
        <div className="rep-row" key={index}>
          <div className="rep-track">
            {[0, 1, 2, 3].map((copy) => (
              <div
                className={`rep-group${copy ? " rep-repeat" : ""}`}
                key={copy}
                aria-hidden={copy ? true : undefined}
              >
                {logos.map(([label, logo, href]) => {
                  const file = logo.replace(/\.[^.]+$/, ".png")
                  const [width, height] = dimensions[file]
                  return (
                    <a
                      key={label}
                      className="rep-logo"
                      data-brand={label}
                      style={{ "--mark-ratio": width / height }}
                      tabIndex={copy ? -1 : undefined}
                      aria-label={`${label} website`}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Image
                        src={`/clients/knockouts/${file}`}
                        alt=""
                        width={width}
                        height={height}
                        unoptimized
                      />
                    </a>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Banner>
  )
}
