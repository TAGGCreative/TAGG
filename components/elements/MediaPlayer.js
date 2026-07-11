import dynamic from "next/dynamic"
import styled from "styled-components"

const VimeoPlayer = dynamic(() => import("react-player/vimeo"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%" }} />,
})

const HlsPlayer = dynamic(() => import("./HlsPlayer"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%" }} />,
})

const CloudflareFrame = styled.iframe`
  border: 0;
  width: 100%;
  height: 100%;
`

function getCloudflarePlayerUrl(source, customerCode, options) {
  if (!source?.id || !customerCode) return null

  const params = new URLSearchParams()
  if (options.autoplay) params.set("autoplay", "true")
  if (options.muted) params.set("muted", "true")
  if (options.loop) params.set("loop", "true")
  if (options.controls === false) params.set("controls", "false")
  params.set("primaryColor", "ed1a62")

  return `https://customer-${customerCode}.cloudflarestream.com/${source.id}/iframe?${params}`
}

export function MediaPlayer({
  source,
  customerCode,
  title,
  width = "100%",
  height = "100%",
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  poster,
  onReady,
  onPlay,
  style,
}) {
  if (source?.provider === "hls" && source.url) {
    return (
      <HlsPlayer
        url={source.url}
        title={title}
        controls={controls}
        autoplay={autoplay}
        muted={muted}
        loop={loop}
        poster={poster}
        onReady={onReady}
        onPlay={onPlay}
        style={{ width, height, ...style }}
      />
    )
  }

  if (source?.provider === "cloudflare") {
    const url = getCloudflarePlayerUrl(source, customerCode, {
      autoplay,
      muted,
      loop,
      controls,
    })

    if (!url) return null

    return (
      <CloudflareFrame
        src={url}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading={autoplay ? "eager" : "lazy"}
        onLoad={() => {
          onReady?.()
          if (autoplay) onPlay?.()
        }}
        style={{ width, height, ...style }}
      />
    )
  }

  if (source?.provider !== "vimeo" || !source.id) return null

  return (
    <VimeoPlayer
      url={`https://player.vimeo.com/video/${source.id}`}
      width={width}
      height={height}
      controls={controls}
      playing={autoplay}
      muted={muted}
      loop={loop}
      onReady={onReady}
      onPlay={onPlay}
      style={style}
      config={{
        vimeo: {
          playerOptions: {
            autoplay,
            muted,
            controls,
            playsinline: true,
            keyboard: controls,
            loop,
            portrait: false,
            background: !controls,
            dnt: true,
            color: "ed1a62",
          },
        },
      }}
    />
  )
}
