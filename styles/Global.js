import { createGlobalStyle } from "styled-components"

export const GlobalStyle = createGlobalStyle`
  /* p */
  @font-face {
    font-family: Consolas;
    src: url("/fonts/ConsolasFont/CONSOLA.ttf") format("truetype");
    font-display: swap;
  }
  /* h */
  @font-face {
    font-family: Montserrat;
    src: url("/fonts/Montserrat/Montserrat-Regular.ttf") format("truetype");
    font-display: swap;
  }
  @font-face {
    font-family: Montserrat-Bold;
    src: url("/fonts/Montserrat/Montserrat-Bold.ttf") format("truetype");
    font-display: swap;
  }
  @font-face {
    font-family: Montserrat-ExtraBold;
    src: url("/fonts/Montserrat/Montserrat-ExtraBold.ttf")
    format("truetype");
    font-display: swap;
  }

  :root {
    --red: #ed1a62;
    --grey: #bfbebf;
    --lightgrey: #e3e3e7;
    --white: #f7f7f7;
    --dark: #1e1e1e;
    --black: #0d1219;
    --blackRGB: 13, 18, 25;
    --scrollpos: 0;
  }

  html, body {
    padding: 0;
    margin: 0;
    background-color: var(--black);
    box-sizing: border-box;
  }

  html {
    overflow: auto;
    scroll-behavior: smooth;
    min-width: 100vw;
  }

  html * {
    box-sizing: border-box;
  }

  .body::-webkit-scrollbar {
    display: none;
  }

  p {
    color: var(--grey);
    font-family: Consolas;
    font-size: 16px;
    line-height: 25px;
    letter-spacing: 25;
    z-index: 5;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  a {
    -webkit-tap-highlight-color: transparent;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
`
