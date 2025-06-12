import styled from "styled-components"
import Link from "next/link"

const Quiet = styled.div`
  display: flex;
  width: 100%;
  margin-top: 100px;
  justify-content: center;
  color: var(--grey);
  font-family: Consolas;
  a,
  p {
    z-index: 15 !important;
  }
`
const PrivacyPolicy = () => {
  return (
    <Quiet>
      <Link href="/privacy-policy" passHref>
        <a>
          <p>Privacy Policy</p>
        </a>
      </Link>
      <p>&nbsp; | &nbsp;© TAGG Creative 2025</p>
    </Quiet>
  )
}
export { PrivacyPolicy }
