import { MediaPlayer } from "./MediaPlayer"

export const FullPlayer = ({ source, customerCode, title, poster }) => {
  return (
    <MediaPlayer
      source={source}
      customerCode={customerCode}
      title={title}
      poster={poster}
      width="100%"
      height="80%"
      controls
      style={{ alignSelf: "center" }}
    />
  )
}
