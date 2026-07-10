import { useState, useEffect, useRef } from "react"

export function useInView(options = {}) {
  const [inView, setInView] = useState(false)
  const ref = useRef()
  const {
    root = null,
    rootMargin = "0px",
    threshold = 0,
    triggerOnce = false,
  } = options

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setInView(false)
        }
      },
      {
        root,
        rootMargin,
        threshold,
      },
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [root, rootMargin, threshold, triggerOnce])

  // Return false during SSR and initial render to prevent hydration mismatch
  return {
    ref,
    inView,
  }
}
