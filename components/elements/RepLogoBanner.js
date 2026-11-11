import Image from "next/image"
import { useState } from "react"
import styled from "styled-components"

const rows = [
  [
    ["Microsoft", "microsoft.png", "https://www.microsoft.com/"],
    ["NBA", "nba.svg", "https://www.nba.com/"],
    ["Amazon", "amazon.svg", "https://aws.amazon.com/"],
    [
      "Skilled Trades College",
      "skilled-trades.png",
      "https://www.skilledtradescollege.ca/",
    ],
    ["Coca-Cola", "cocacola.svg", "https://www.coca-cola.com/"],
    ["Chevron", "chevron.svg", "https://www.chevron.com/"],
    ["Seattle Seahawks", "seahawks.svg", "https://www.seahawks.com/"],
    ["Zappos", "zappos.svg", "https://www.zappos.com/"],
    ["Teekay", "teekay.svg", "https://www.teekay.com/"],
    ["Cult", "cult.svg", "https://cultideas.com/"],
  ],
  [
    [
      "Microsoft for Business",
      "microsoft.png",
      "https://www.microsoft.com/en-us/microsoft-365/business",
      "FOR BUSINESS",
    ],
    ["Perfect Sports", "perfect-sports.png", "https://perfectsports.com/"],
    ["ESPN", "espn.svg", "https://www.espn.com/"],
    ["Ultramar", "ultramar.svg", "https://www.ultramar.ca/"],
    ["Amazon Business", "amazon-business.png", "https://business.amazon.com/"],
    ["Under Armour", "underarmour.svg", "https://www.underarmour.com/"],
    ["Spotify", "spotify.svg", "https://www.spotify.com/"],
    ["Intel", "intel.svg", "https://www.intel.com/"],
    ["Hot Wheels", "hotwheels.svg", "https://hotwheels.mattel.com/"],
  ],
]

const Banner = styled.div`
  position: relative;
  max-width: 110rem;
  margin: 0 auto;
  padding: clamp(2.75rem, 5vw, 4.5rem) 0 1rem;

  @keyframes rep-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
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

  .rep-row + .rep-row .rep-track {
    animation-direction: reverse;
    animation-duration: 48s;
  }

  .rep-row:hover .rep-track {
    animation-play-state: paused;
  }

  .rep-group {
    display: flex;
    flex: none;
    min-width: min(100vw, 110rem);
    justify-content: space-around;
  }

  .rep-logo {
    display: grid;
    align-content: center;
    justify-items: center;
    flex: none;
    width: clamp(9rem, 15vw, 15rem);
    height: clamp(4.5rem, 7vw, 7.2rem);
    padding: 0.65rem clamp(0.7rem, 1vw, 1.25rem);
    color: white;
  }

  .rep-logo img {
    width: 100%;
    height: clamp(2.9rem, 4.7vw, 4rem);
    object-fit: contain;
    transition: filter 160ms ease;
  }

  .rep-logo[data-brand="Chevron"] img,
  .rep-logo[data-brand="Ultramar"] img,
  .rep-logo[data-brand="Under Armour"] img,
  .rep-logo[data-brand="Intel"] img {
    height: clamp(2.55rem, 4.2vw, 3.65rem);
  }

  .rep-logo:hover img,
  .rep-logo:focus-visible img {
    filter: drop-shadow(-3px 3px var(--red));
  }

  .rep-logo span {
    font:
      0.62rem Consolas,
      monospace;
    letter-spacing: 0.08em;
  }

  .rep-toggle {
    display: block;
    margin: 0.65rem clamp(0.5rem, 3vw, 2rem) 0 auto;
    padding: 0.5rem;
    border: 0;
    background: transparent;
    color: var(--lightgrey);
    font:
      0.68rem Consolas,
      monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }

  &[data-paused="true"] .rep-row,
  .rep-row:has(.rep-logo:focus-visible) {
    mask-image: none;
  }

  &[data-paused="true"] .rep-track,
  .rep-row:has(.rep-logo:focus-visible) .rep-track {
    width: 100%;
    animation: none;
  }

  &[data-paused="true"] .rep-group,
  .rep-row:has(.rep-logo:focus-visible) .rep-group {
    min-width: 0;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  &[data-paused="true"] .rep-repeat,
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
    .rep-repeat,
    .rep-toggle {
      display: none;
    }
  }
`

export default function RepLogoBanner() {
  const [paused, setPaused] = useState(false)
  return (
    <Banner data-paused={paused}>
      {rows.map((logos, index) => (
        <div className="rep-row" key={index}>
          <div className="rep-track">
            {[false, true].map((repeat) => (
              <div
                className={`rep-group${repeat ? " rep-repeat" : ""}`}
                key={String(repeat)}
                aria-hidden={repeat || undefined}
              >
                {logos.map(([label, logo, href, sublabel]) => (
                  <a
                    key={label}
                    className="rep-logo"
                    data-brand={label}
                    tabIndex={repeat ? -1 : undefined}
                    aria-label={`${label} website`}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src={`/clients/knockouts/${logo.replace(/\.[^.]+$/, ".png")}`}
                      alt=""
                      width={192}
                      height={96}
                      unoptimized
                    />
                    {sublabel && <span>{sublabel}</span>}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        className="rep-toggle"
        type="button"
        onClick={() => setPaused(!paused)}
      >
        {paused ? "Resume logo scroll" : "Pause logo scroll"}
      </button>
    </Banner>
  )
}
