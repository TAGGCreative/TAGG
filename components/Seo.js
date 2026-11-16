import Head from "next/head"
import {
  absoluteUrl,
  canonicalUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "../lib/seo.mjs"

export default function Seo({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  socialDescription = description,
  path = "/",
  image,
  imageAlt = title,
  noIndex = false,
}) {
  const url = canonicalUrl(path)
  const imageUrl = absoluteUrl(image)

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} key="description" />
      <link rel="canonical" href={url} key="canonical" />
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:site_name" content={SITE_NAME} key="og:site_name" />
      <meta property="og:title" content={title} key="og:title" />
      <meta
        property="og:description"
        content={socialDescription}
        key="og:description"
      />
      <meta property="og:url" content={url} key="og:url" />
      <meta
        name="twitter:card"
        content={imageUrl ? "summary_large_image" : "summary"}
        key="twitter:card"
      />
      <meta name="twitter:title" content={title} key="twitter:title" />
      <meta
        name="twitter:description"
        content={socialDescription}
        key="twitter:description"
      />
      {imageUrl && (
        <meta property="og:image" content={imageUrl} key="og:image" />
      )}
      {imageUrl && (
        <meta property="og:image:alt" content={imageAlt} key="og:image:alt" />
      )}
      {imageUrl && (
        <meta name="twitter:image" content={imageUrl} key="twitter:image" />
      )}
      {noIndex && (
        <meta name="robots" content="noindex, nofollow" key="robots" />
      )}
    </Head>
  )
}
