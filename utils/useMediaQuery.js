import { useCallback, useSyncExternalStore } from "react"

export function useMediaQuery({ query }) {
  const subscribe = useCallback(
    (callback) => {
      const mediaQuery = window.matchMedia(query)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", callback)
        return () => mediaQuery.removeEventListener("change", callback)
      }
      mediaQuery.addListener(callback)
      return () => mediaQuery.removeListener(callback)
    },
    [query],
  )

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  )
  const getServerSnapshot = useCallback(() => undefined, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
