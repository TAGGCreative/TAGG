import Head from "next/head"
import isPropValid from "@emotion/is-prop-valid"
import { StyleSheetManager } from "styled-components"
import { GlobalStyle } from "../styles/Global"
import { useRouter } from "next/router"
import Seo from "../components/Seo"

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  return (
    <>
      <Seo
        path={router.asPath}
        socialDescription="Bold films, branded content, and post-production from Vancouver."
        noIndex={router.isPreview || router.pathname === "/modal-lab"}
      />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0d1219" />
        <link rel="icon" href="/images/favicon/favicon.ico" />
        <link
          rel="preload"
          href="/fonts/ConsolasFont/CONSOLA.woff2"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-Regular.woff2"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-Bold.woff2"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-ExtraBold.woff2"
          as="font"
          crossOrigin=""
        />
      </Head>
      <GlobalStyle />
      <StyleSheetManager
        shouldForwardProp={(propName, target) =>
          typeof target === "string" ? isPropValid(propName) : true
        }
      >
        <Component {...pageProps} />
      </StyleSheetManager>
    </>
  )
}

export default MyApp
