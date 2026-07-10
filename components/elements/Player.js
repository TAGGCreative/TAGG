import { MediaPlayer } from "./MediaPlayer"

export const FullPlayer = ({ source, customerCode, title }) => {
  return (
    <MediaPlayer
      source={source}
      customerCode={customerCode}
      title={title}
      width="100%"
      height="80%"
      controls
      style={{ alignSelf: "center" }}
    />
  )
}
