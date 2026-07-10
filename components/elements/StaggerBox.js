import styled from "styled-components"

export const StaggerBox = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 70%;

  @media screen and (max-width: 425px) {
    display: block;
    width: 95%;
    margin-bottom: 2em;
  }

  & > * {
    width: 45% !important;
    max-width: 45% !important;
    min-width: 45% !important;
    margin-bottom: 1em;
    flex-shrink: 0;
    &:not(:first-child) {
      margin-top: ${({ marginTop }) => marginTop || "-3em"};
    }
    @media screen and (max-width: 425px) {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 100% !important;
      margin-bottom: 0;
      &:not(:first-child) {
        margin-top: 0;
      }
    }

    & img {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 100% !important;
      height: auto !important;
    }
  }

  & > :nth-child(odd) {
    align-self: flex-start;
  }

  & > :nth-child(even) {
    align-self: flex-end;
  }
`
