import { Vimeo } from "vimeo"
import { config } from "dotenv"
// --- TEMP OVERRIDES (kill broken thumb) ---
// If a video ID is listed here, we bypass Vimeo's animated lookup
// and hand back this object instead (same shape your code expects).
const TEMP_GIF_OVERRIDES = {
  "/videos/1123017366": {
    // Use a working animated GIF/WebP URL if you have one.
    // For now, we point to the 1920x1080 POSTER so it never breaks.
    link: "https://i.vimeocdn.com/video/2064552800-45cdc1ccefb61cd9b3a5519df92c64b309bd86e6fd34b374f195657b666661cc-d_1920x1080?&r=pad&region=us",
    created_on: Math.floor(Date.now() / 1000)
  }
};

// add .env file to process in dev
config()
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const ACCESS_TOKEN = process.env.ACCESS_TOKEN

export const TAGG_ID = process.env.TAGG_ID
export const vimeoClient = new Vimeo(CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN)

// === Vimeo API Calls Used === //

/* Authentication
 If you need to generate another credientials set,
 console.log the variables from this request and save them
 to the .env file at the root. This can also be done on the
 Vimeo website.

 `scope` is an array of permissions your token needs to access. You
 can read more at https://developer.vimeo.com/api/authentication#supported-scopes
*/

// const getToken = async () => {
//   const token = await new Promise((resolve, reject) => {
//     vimeoClient.generateClientCredentials(["public"], (err, response) => {
//       if (err) {
//         reject(err)
//       }

//       const token = response.access_token
//       //  Other useful information is included alongside the access token,
//       //  which you can dump out to see, or visit our API documentation.

//       const scopes = response.scope
//       //  We include the final scopes granted to the token. This is
//       //  important because the user, or API, might revoke scopes during
//       //  the authentication process.

//       console.log(scopes)
//       console.log(token)
//       resolve(token)
//     })
//   })
//   vimeoClient.setAccessToken(token)
// }
// getToken()

// featured-clips-9-16 showcase for mobile carousel
// https://vimeo.com/manage/showcases/8493940/info
export const getClipsMobile = async (album_id = "8493940") => {
  const clipList = await new Promise((resolve, reject) => {
    vimeoClient.request(
      `/users/${TAGG_ID}/albums/${album_id}/videos?sort=manual`,
      (error, body, status_code, headers) => {
        console.log("getClipsMobile:", album_id, status_code)
        if (error) {
          console.error(error)
          reject(error)
        }
        resolve(body?.data)
      },
    )
  })

  console.log(clipList.length, "mobile clips")

  return clipList
}

// featured-clips-16-9 showcase for desktop carousel
// https://vimeo.com/manage/showcases/8493934/info
export const getClipsDesktop = async (album_id = "8493934") => {
  const clipList = await new Promise((resolve, reject) => {
    vimeoClient.request(
      `/users/${TAGG_ID}/albums/${album_id}/videos?sort=manual`,
      (error, body, status_code, headers) => {
        console.log("getClipsDesktop:", album_id, status_code)
        if (error) {
          console.error(error)
          reject(error)
        }

        resolve(body?.data)
      },
    )
  })

  console.log(clipList.length, "desktop clips")

  return clipList
}

// featured-works showcase
// https://vimeo.com/manage/showcases/8478566/info
export const getWorks = async (album_id = "8478566") => {
  const videoList = await new Promise((resolve, reject) => {
    vimeoClient.request(
      `/users/${TAGG_ID}/albums/${album_id}/videos?sort=manual`,
      (error, body, status_code, headers) => {
        console.log("getWorks:", status_code)
        if (error) {
          console.error(error)
          reject(error)
        }

        resolve(body?.data)
      },
    )
  })

  const slimVideoList = videoList.map(({ uri, description, pictures }) => ({
    uri,
    description: tryToParseJSONdescription(description),
    pictures,
  }))

  return slimVideoList
}

// Thumbnails:
// Create a new set: Go to the advanced settings of a video from vimeo.com to create
// The site will use the most recently created thumbnail.
// https://vimeo.com/blog/post/how-to-turn-your-videos-into-gifs/
export const getMostRecentAnimatedThumb = async (uri) => {
  if (TEMP_GIF_OVERRIDES[uri]) {
    return TEMP_GIF_OVERRIDES[uri];
  }
  // (rest of the function stays the same)
  const gifs = await new Promise((resolve, reject) => {
    vimeoClient.request(
      {
        method: "GET",
        path: `${uri}/animated_thumbsets`,
        userId: TAGG_ID,
      },
      (error, body, status_code, headers) => {
        console.log("getAnimatedThumbs:", uri, status_code)

        if (error) {
          console.error(error)
          reject(error)
        }

        resolve(body?.data)
      },
    )
  })

  const mostRecent = gifs?.sort(
    (thumbA, thumbB) => thumbB.created_on - thumbA.created_on,
  )[0]

  if (!gifs.length) {
    console.log(uri, "missing animated thumb!")
  }

  return mostRecent ?? null
}

export function tryToParseJSONdescription(jsonString) {
  try {
    JSON.parse(jsonString)
    return jsonString
  } catch (error) {
    console.log("bad JSON description:")
    console.log(jsonString)
    console.error(error)

    return JSON.stringify({
      client: "unknown",
      title: "unknown",
    })
  }
}
