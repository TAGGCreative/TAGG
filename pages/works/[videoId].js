import { useEffect } from "react"
import { useRouter } from "next/router"
import WorkPage from "../../components/WorkPage"
import {
  getCloudflareCustomerCode,
  getWork,
  getWorks,
} from "../../lib/mediaCatalog"

// because this is a dynamic route, get all possible routes at build
export async function getStaticPaths() {
  const videolist = getWorks()

  const paths = videolist.map((video) => {
    return {
      params: {
        videoId: video.id,
      },
    }
  })

  return {
    paths,
    fallback: "blocking",
  }
}

export async function getStaticProps({ params }) {
  const { videoId } = params
  const work = getWork(videoId)

  if (!work) {
    return { notFound: true }
  }

  return {
    props: {
      videos: getWorks(),
      videoId,
      cloudflareCustomerCode: getCloudflareCustomerCode(),
    },
  }
}

const WorkPageModal = ({ videos, videoId, cloudflareCustomerCode }) => {
  const router = useRouter()

  useEffect(() => {
    router.prefetch("/")
    const closeOnEscape = (event) => {
      if (event.key === "Escape") router.push("/#works")
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Work modal"
      style={{
        position: "fixed",
        zIndex: 1000,
        backgroundColor: "var(--black)",
        margin: 0,
        padding: 0,
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "auto",
      }}
    >
      <WorkPage
        videos={videos}
        videoId={videoId}
        cloudflareCustomerCode={cloudflareCustomerCode}
      />
    </div>
  )
}

export default WorkPageModal
