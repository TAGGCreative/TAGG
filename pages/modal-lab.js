import Head from "next/head"
import VideoModalPrototype from "../components/VideoModalPrototype"
import { getCloudflareCustomerCode, getWorks } from "../lib/mediaCatalog"

export async function getStaticProps() {
  return {
    props: {
      works: getWorks().slice(0, 3),
      customerCode: getCloudflareCustomerCode(),
    },
  }
}

export default function ModalLab({ works, customerCode }) {
  return (
    <>
      <Head>
        <title>Video Modal Lab | TAGG Creative</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="modal-lab-page">
        <div className="modal-lab-intro">
          <span>Interaction study · 01</span>
          <h1>Video modal</h1>
          <p>Choose a thumbnail to test the transition.</p>
        </div>
        <VideoModalPrototype works={works} customerCode={customerCode} />
      </main>
      <style jsx>{`
        .modal-lab-page {
          min-height: 100svh;
          padding: clamp(36px, 7vw, 100px);
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(237, 26, 98, 0.13),
              transparent 28%
            ),
            #0d1219;
        }

        .modal-lab-intro {
          max-width: 760px;
          margin-bottom: clamp(40px, 7vw, 88px);
        }

        .modal-lab-intro span {
          color: #ed1a62;
          font-family: Consolas, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .modal-lab-intro h1 {
          margin: 12px 0 8px;
          color: #f7f7f7;
          font-family: Montserrat-ExtraBold, sans-serif;
          font-size: clamp(48px, 8vw, 112px);
          line-height: 0.88;
          letter-spacing: -0.065em;
          text-transform: uppercase;
        }

        .modal-lab-intro p {
          margin: 0;
          color: rgba(247, 247, 247, 0.46);
          font-size: 13px;
        }

        @media (max-width: 620px) {
          .modal-lab-page {
            padding: 28px 16px 64px;
          }
        }
      `}</style>
    </>
  )
}
