import Head from "next/head"
import PoppedHeader from "./PoppedHeader"
import styled from "styled-components"
import { FullPlayer } from "./elements/Player"
import { DividerWithArrows } from "./elements/DividerWithArrows"
import { useRouter } from "next/router"

const Content = styled.section`
  background-color: var(--black);
  width: 100%;
  height: 100vh;
  min-height: 100svh;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  padding: 5%;

  box-sizing: border-box;
  & * {
    box-sizing: border-box;
  }
`
const SmallRedHeader = styled.h3`
  text-transform: uppercase;
  font-size: 1rem;
  color: var(--red);
  user-select: none;
  font-family: Consolas, sans-serif;
  font-weight: 700;
`
const Credits = styled.div`
  width: calc(100% - 80px); /* TriangleButtonx2 */
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: -2em;

  @media screen and (max-width: 425px) {
    flex-direction: column;
  }
`
const CloseButton = styled.button`
  position: absolute;
  right: 32px;
  top: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &::before,
  &::after {
    position: absolute;
    left: 15px;
    content: "";
    height: 33px;
    width: 2px;
    background-color: var(--grey);
  }

  &::before {
    transform: rotate(45deg);
  }
  &::after {
    transform: rotate(-45deg);
  }

  &:hover {
    &::before,
    &::after {
      background-color: var(--white);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--white);
    outline-offset: 8px;
  }

  &:active {
    &::before,
    &::after {
      background-color: var(--red);
    }
  }
`

const Credit = styled.div`
  height: fit-content;
  margin: 1em;

  :first-child {
    margin-left: 0;
  }

  h3 {
    margin: 0;
  }

  p {
    margin: 0;
  }
`

export default function WorkPage({ videos, videoId, cloudflareCustomerCode }) {
  const router = useRouter()
  const activeVideoId = String(router.query.videoId || videoId)
  const video = videos.find((candidate) => candidate.id === activeVideoId)

  if (!video) {
    console.error(`Unable to locate video for id ${videoId}`)
    return null
  }

  const clientName = video.client || "Unknown Client"
  const title = video.title || "Untitled"

  const navigateRelative = (offset) => {
    if (!Array.isArray(videos) || videos.length === 0) {
      return
    }

    const currentIndex = videos.findIndex(({ id }) => id === video.id)
    if (currentIndex === -1) {
      return
    }

    const newIndex = (currentIndex + offset + videos.length) % videos.length
    const nextVideo = videos[newIndex]

    if (!nextVideo) {
      return
    }

    if (nextVideo.id) {
      router.push(`/works/[videoId]`, `/works/${nextVideo.id}`, {
        shallow: true,
      })
    }
  }

  return (
    <>
      <Head>
        <title>{`${clientName} — ${title} | TAGG Creative`}</title>
        <meta
          name="description"
          content={`${title}, created for ${clientName} by TAGG Creative.`}
        />
      </Head>
      <Content>
        <CloseButton
          type="button"
          aria-label="Close project"
          onClick={() => router.push("/#works")}
        />
        <FullPlayer
          source={video.source}
          customerCode={cloudflareCustomerCode}
          title={`${clientName} — ${title}`}
          poster={video.poster?.src}
        />
        <PoppedHeader style={{ marginTop: "2em", marginBottom: 0 }}>
          {clientName}
        </PoppedHeader>
        <p style={{ marginBottom: "-20px" }}>{title}</p>
        <DividerWithArrows
          onLeft={() => navigateRelative(-1)}
          onRight={() => navigateRelative(1)}
        />
        <Credits>
          {Object.entries(video.credits || {}).map(([key, value]) => {
            if (value) {
              return (
                <Credit key={key}>
                  <SmallRedHeader>{key}</SmallRedHeader>
                  <p>{value}</p>
                </Credit>
              )
            }

            return null
          })}
        </Credits>
      </Content>
    </>
  )
}
