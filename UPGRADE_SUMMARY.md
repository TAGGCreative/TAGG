# Stabilization summary

## Platform

- Next.js 16.2.10
- React and React DOM 19.2.7
- styled-components 6.4.3
- Node.js 20.9 or newer

## Media

- The site now builds from `content/media-catalog.json`.
- Builds and page requests no longer call Vimeo.
- The previous runtime GIF-to-video conversion endpoint has been removed.
- Twenty-one poster sets and hover previews are now served as local static
  assets.
- A resumable one-time migration command moves full videos and carousel clips
  from Vimeo to Cloudflare Stream and saves progress after every upload.

## Reliability and performance

- Removed the 60-second regeneration loop and repeated Vimeo API calls.
- Removed eager loading of every hover video on the homepage.
- New hover previews load only after pointer or keyboard interaction.
- Project routes are generated from the frozen catalog and support blocking
  fallback behavior.
- Strict Mode is enabled and the previous animation observer leaks were removed.

## Quality

- ESLint Core Web Vitals rules and Prettier checks are available as scripts.
- Interactive arrow and close controls are real keyboard-accessible buttons.
- Reduced-motion behavior, semantic homepage heading, improved alternative text,
  and expanded metadata are included.
- Unused and vulnerable dependencies were removed.
