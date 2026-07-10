import Head from "next/head"
import { GlobalStyle } from "../styles/Global"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TAGG Creative</title>
        <meta
          name="description"
          content="TAGG Creative is a Vancouver production studio creating bold films, branded content, and post-production work."
        />
        <meta name="theme-color" content="#0d1219" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TAGG Creative" />
        <meta property="og:title" content="TAGG Creative" />
        <meta
          property="og:description"
          content="Bold films, branded content, and post-production from Vancouver."
        />
        <meta name="twitter:card" content="summary" />
        <link rel="icon" href="/images/favicon/favicon.ico" />
        <link
          rel="preload"
          href="/fonts/ConsolasFont/CONSOLA.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-Bold.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-ExtraBold.ttf"
          as="font"
          crossOrigin=""
        />
      </Head>
      <GlobalStyle />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
