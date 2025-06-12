import styled from "styled-components"
import PoppedHeader from "./PoppedHeader"

const CardStyles = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;

  a {
    cursor: pointer;
    z-index: 3;
  }

  p {
    color: var(--lightgrey);
    font-family: Consolas;
    text-align: center;
    text-transform: uppercase;
    z-index: 2;
  }

  #icons {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 2em 5em;
  }

  #icons svg {
    stroke: var(--grey);
    fill: var(--grey);
    height: 2em;
    width: auto;
    margin-left: 2em;
    margin-right: 2em;
  }

  #icons svg:hover {
    stroke: var(--white);
    fill: var(--white);
  }

  #icons svg:active {
    stroke: var(--red);
    fill: var(--red);
  }
`

export default function ContactCard({ style }) {
  return (
    <CardStyles style={style}>
      <a href="mailto:info@taggcreative.com" target="_blank">
        <PoppedHeader>info@taggcreative.com</PoppedHeader>
      </a>
      <a href="https://goo.gl/maps/YuozNgimFFpJ6Wdv5" target="_blank">
        <p>
          128 W Pender St, Suite 1607
          <br />
          Vancouver, BC, Canada
          <br />
          V6B 1R8
        </p>
      </a>
      <div id="icons">
        <a
          href="https://www.linkedin.com/company/tagg-creative-inc./about/"
          target="_blank"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 70 85"
            height="800"
            width="800"
            style={{ height: "2.5em" }}
          >
            <path d="M72.865 61.1094a1.2 1.2 0 001.21-1.269c0-.9-.543-1.33-1.657-1.33h-1.8v4.712h.677v-2.054h.832l.019.025 1.291 2.029h.724l-1.389-2.1zm-.783-.472h-.785v-1.593h.995c.514 0 1.1.084 1.1.757 0 .774-.593.836-1.314.836m-16.873-5.433h-9.6v-15.034c0-3.585-.064-8.2-4.993-8.2-5 0-5.765 3.906-5.765 7.939v15.294h-9.6v-30.916h9.216v4.225h.129a10.1 10.1 0 019.093-4.994c9.73 0 11.524 6.4 11.524 14.726zm-40.79-35.143a5.571 5.571 0 115.57-5.572 5.571 5.571 0 01-5.57 5.572m4.8 35.143h-9.61v-30.917h9.61zm40.776-55.2H4.781A4.728 4.728 0 000 4.6744v55.439a4.731 4.731 0 004.781 4.675h55.21a4.741 4.741 0 004.8-4.675V4.6704a4.738 4.738 0 00-4.8-4.67"></path>
            <path d="M72.164 56.4114a4.418 4.418 0 10.085 0h-.085m0 8.33a3.874 3.874 0 113.809-3.938v.065a3.791 3.791 0 01-3.708 3.871h-.1"></path>
          </svg>
        </a>
        <a href="https://www.instagram.com/taggcreative/" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path
              d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9
          114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1
          0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6
          74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9
          0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1
          27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9
          0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0
          184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1
          184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9
          2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6
          42.6-29.5 11.7-99.5 9-132.1 9s-102.7
          2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7
          9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9
          132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9
          99.5 9 132.1s2.7 102.7-9 132.1z"
            />
          </svg>
        </a>
        <a href="https://vimeo.com/taggcreative" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path
              d="M447.8 153.6c-2 43.6-32.4 103.3-91.4 179.1-60.9 79.2-112.4
          118.8-154.6 118.8-26.1 0-48.2-24.1-66.3-72.3C100.3 250 85.3 174.3
          56.2 174.3c-3.4 0-15.1 7.1-35.2 21.1L0 168.2c51.6-45.3 100.9-95.7
          131.8-98.5 34.9-3.4 56.3 20.5 64.4 71.5 28.7 181.5 41.4 208.9 93.6
          126.7 18.7-29.6 28.8-52.1 30.2-67.6 4.8-45.9-35.8-42.8-63.3-31
          22-72.1 64.1-107.1 126.2-105.1 45.8 1.2 67.5 31.1 64.9 89.4z"
            />
          </svg>
        </a>
      </div>
    </CardStyles>
  )
}
