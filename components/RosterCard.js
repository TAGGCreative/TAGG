import styled from "styled-components"
import Image from "next/image"

const splitBioIntoLines = (text, maxCharacters = 42) => {
  const words = text.trim().split(/\s+/)
  const lines = []
  let line = ""

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word
    if (line && candidate.length > maxCharacters) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  if (line) lines.push(line)
  return lines
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  height: auto;
  z-index: 2;
  padding: 1em 1em;
  max-width: 500px; // image width

  .text {
    display: flex;
    flex-direction: column;
    z-index: 2;
    filter: grayscale(100%);
    transition: all 0.35s ease;
  }

  img {
    width: 100%;
    transition: all 0.35s ease;
    filter: grayscale(100%);
  }

  .image-container {
    position: relative;
    width: fit-content;
    height: fit-content;
    margin-top: -3%;
  }

  .image-container .after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: #fff;
    opacity: ${({ overlayOpacity }) => overlayOpacity || 0.93};
  }

  h3 {
    background-color: transparent;
    color: var(--red);
    margin: 0.15em;
    font-family: Montserrat-ExtraBold;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h4 {
    background-color: var(--red);
    color: var(--white);
    width: fit-content;
    margin: 0.15em 6px;
    padding: 0.2em 0.5em;
    transform: translateX(-0.7em);
    font-family: Montserrat-Bold;
    font-weight: 700;
  }

  .company {
    background-color: transparent;
    font-size: 13px;
    color: var(--white);
    font-family: Consolas;
    letter-spacing: 0.25em;
    margin-top: 0;
    margin-bottom: 0;
  }

  .bio-reveal {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 1.05s cubic-bezier(0.65, 0, 0.35, 1);
  }

  .bio-reveal-inner {
    min-height: 0;
    overflow: hidden;
  }

  p {
    margin: 0;
    padding-top: 0.9em;
    background-color: transparent;
    color: var(--grey);
    font-family: Consolas;
    line-height: 25px;
    letter-spacing: 25;
    max-width: 100%;
  }

  .bio-line {
    display: block;
    opacity: 0;
    transform: translateY(-0.65em);
    transition:
      opacity 0.55s ease,
      transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    .bio-reveal {
      grid-template-rows: 1fr;
    }

    .bio-line {
      opacity: 1;
      transform: translateY(0);
      transition-delay: var(--bio-line-delay);
    }

    img {
      filter: grayscale(0%);
    }

    .after {
      display: block;
      opacity: 0;
    }

    .text {
      filter: grayscale(0%);
    }
  }

  @media screen and (max-width: 425px) {
    .bio-reveal {
      grid-template-rows: 1fr;
      transition: none;
    }

    .bio-line {
      opacity: 1;
      transform: none;
      transition: none;
    }

    img {
      filter: grayscale(0%);
    }

    .after {
      display: block;
      opacity: 0;
    }

    .text {
      filter: grayscale(0%);
    }
  }
`

export default function RosterCard({
  given,
  sur,
  role,
  company,
  bio,
  head,
  mask,
  overlayOpacity,
}) {
  return (
    <Card overlayOpacity={overlayOpacity}>
      <div className="image-container">
        <Image
          src={head}
          alt={`Profile of ${given} ${sur}`}
          width={500}
          height={400}
          sizes="(max-width: 425px) 95vw, 35vw"
        />
        <Image
          src={mask}
          className="after"
          alt=""
          aria-hidden="true"
          width={500}
          height={400}
          sizes="(max-width: 425px) 95vw, 35vw"
        />
      </div>
      <div className="text">
        <h3>
          {given}&nbsp;{sur}
        </h3>
        {company && <h4 className="company">{company}</h4>}
        <h4>{role}</h4>
        {bio && (
          <div className="bio-reveal">
            <div className="bio-reveal-inner">
              <p>
                {splitBioIntoLines(bio).map((line, index, lines) => (
                  <span
                    className="bio-line"
                    key={`${index}-${line}`}
                    style={{ "--bio-line-delay": `${120 + index * 85}ms` }}
                  >
                    {line}
                    {index < lines.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
