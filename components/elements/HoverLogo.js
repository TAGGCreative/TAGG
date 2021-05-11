import Image from "next/image"
import { useState } from "react"

export default function HoverLogo({ active, inactive }) {
  const [src, setSrc] = useState(inactive)
  return (
    <div style={{ margin: "3em" }}>
      <Image
        src={src}
        height="100px"
        width="100px"
        onMouseLeave={() => setSrc(inactive)}
        onMouseEnter={() => setSrc(active)}
      />
    </div>
  )
}
