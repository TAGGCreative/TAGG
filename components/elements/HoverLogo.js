import styled from "styled-components"

const HoverLogo = styled.img`
  src: ${({ src }) => src};
  height: 140px;
  width: 180px;
  object-fit: contain;
  filter: invert(89%) sepia(0%) saturate(2198%) hue-rotate(292deg)
    brightness(90%) contrast(81%);
  transition: all 100ms ease-in-out;

  @media screen and (max-width: 425px) {
    height: 76px;
    width: 104px;
  }

  &:hover {
    -webkit-filter: invert(100%) sepia(6%) saturate(0%) hue-rotate(241deg)
      brightness(117%) contrast(94%) drop-shadow(-3px 3px var(--red));
    filter: invert(100%) sepia(6%) saturate(0%) hue-rotate(241deg)
      brightness(117%) contrast(94%) drop-shadow(-3px 3px var(--red));
  }
`

const Client = ({ src, href, id, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    id={id}
    aria-label={`${label} website`}
  >
    <HoverLogo src={"/clients/" + src} alt={label} />
  </a>
)

export default Client
