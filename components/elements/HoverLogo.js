import styled from "styled-components"

const HoverLogo = styled.img`
  src: ${({ src }) => src};
  height: 200px;
  width: 200px;
  filter: invert(89%) sepia(0%) saturate(2198%) hue-rotate(292deg)
    brightness(90%) contrast(81%);
  transition: all 100ms ease-in-out;

  @media screen and (max-width: 425px) {
    height: 100px;
    width: 100px;
  }

  &:hover {
    -webkit-filter: invert(100%) sepia(6%) saturate(0%) hue-rotate(241deg)
      brightness(117%) contrast(94%) drop-shadow(-3px 3px var(--red));
    filter: invert(100%) sepia(6%) saturate(0%) hue-rotate(241deg)
      brightness(117%) contrast(94%) drop-shadow(-3px 3px var(--red));
  }
`

const Client = ({ src, href }) => (
  <a href={href} target="_blank">
    <HoverLogo src={"/clients/" + src} />
  </a>
)

export default Client
