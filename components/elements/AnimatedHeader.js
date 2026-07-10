import { useEffect, useRef } from "react"
import styled from "styled-components"

const AnimatedSVG = styled.div`
  width: 100%;
  padding: 0 1em;

  @media screen and (max-width: 425px) {
    padding: 0;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
      stroke-opacity: 1;
    }
  }

  svg {
    -webkit-text-fill-color: transparent;
    -webkit-text-stroke: 1px var(--red);
    background-color: transparent;
    stroke: var(--red);
    fill: transparent;
    width: 100%;
    stroke-opacity: 0;
  }

  &.animate-paths g path {
    animation: draw 2s ease-in-out forwards;
  }

  &.animation-locked g path {
    stroke-dashoffset: 0 !important;
    stroke-opacity: 1 !important;
    animation: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    svg,
    g path {
      stroke-opacity: 1;
      stroke-dashoffset: 0 !important;
      animation: none !important;
    }
  }
`

export const AnimatedHeader = ({ children, id }) => {
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !id) return undefined

    const paths = Array.from(element.querySelectorAll("g path"))
    if (!paths.length) return undefined

    const lock = () => {
      hasAnimated.current = true
      element.classList.remove("animate-paths")
      element.classList.add("animation-locked")
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lock()
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return

        paths.forEach((path) => {
          const length = Math.ceil(path.getTotalLength())
          path.style.strokeDasharray = String(length)
          path.style.strokeDashoffset = String(length)
        })

        element.classList.add("animate-paths")
        paths[0].addEventListener("animationend", lock, { once: true })
        observer.disconnect()
      },
      { threshold: 0.1 },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      paths[0].removeEventListener("animationend", lock)
    }
  }, [id])

  return (
    <AnimatedSVG id={id} ref={ref} aria-hidden="true">
      {children}
    </AnimatedSVG>
  )
}
