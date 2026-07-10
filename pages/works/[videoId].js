import { useEffect } from "react"
import { useRouter } from "next/router"
import Modal from "react-modal"
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
    Modal.setAppElement("#__next")
    router.prefetch("/")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Modal
      isOpen={true} // The modal should always be shown on page load, it is the 'page'
      onRequestClose={() => router.push("/#works")}
      contentLabel="Work modal"
      shouldCloseOnEsc={true}
      style={{
        content: {
          backgroundColor: "var(--black)",
          border: "none",
          borderRadius: 0,
          margin: 0,
          padding: 0,
          inset: 0,
          width: "100vw",
          height: "100vh",
        },
      }}
    >
      <WorkPage
        videos={videos}
        videoId={videoId}
        cloudflareCustomerCode={cloudflareCustomerCode}
      />
    </Modal>
  )
}

export default WorkPageModal
