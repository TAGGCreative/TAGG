import { createGlobalStyle } from "styled-components"

export const GlobalStyle = createGlobalStyle`
  /* p */
  @font-face {
    font-family: Consolas;
    src: url("/fonts/ConsolasFont/CONSOLA.woff2") format("woff2");
    font-display: block;
    font-style: normal;
    font-weight: 400;
  }
  /* h */
  @font-face {
    font-family: Montserrat;
    src: url("/fonts/Montserrat/Montserrat-Regular.woff2") format("woff2");
    font-display: block;
    font-style: normal;
    font-weight: 400;
  }
  @font-face {
    font-family: Montserrat-Bold;
    src: url("/fonts/Montserrat/Montserrat-Bold.woff2") format("woff2");
    font-display: block;
    font-style: normal;
    font-weight: 700;
  }
  @font-face {
    font-family: Montserrat-ExtraBold;
    src: url("/fonts/Montserrat/Montserrat-ExtraBold.woff2")
    format("woff2");
    font-display: block;
    font-style: normal;
    font-weight: 800;
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
    width: 100%;
    overflow-x: clip;
  }

  html {
    overflow: auto;
    scroll-behavior: smooth;
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

  .cms-preview-banner {
    position: fixed;
    z-index: 9999;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 18px;
    align-items: center;
    padding: 9px 14px;
    border: 1px solid var(--red);
    border-radius: 999px;
    background: rgba(13, 18, 25, 0.94);
    color: var(--white);
    font: 12px Consolas, monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .cms-preview-banner a { color: var(--red); }

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
