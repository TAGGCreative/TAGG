import { createContext, useContext } from "react"

export const VideoModalContext = createContext(null)

export function useVideoModal() {
  const openProject = useContext(VideoModalContext)
  if (!openProject) {
    throw new Error("useVideoModal must be used inside VideoModal")
  }
  return openProject
}
