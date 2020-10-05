/* eslint-disable no-console */
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// import functions from "firebase-functions"
// import * as Sentry from "@sentry/node"
import admin from "firebase-admin"

// Sentry.init({
//   dsn: process.env.NODE_SENTRY,
//   environment: process.env.NODE_ENVIRONMENT,
// })

type EnhancedRequest = express.Request & {
  user?: admin.auth.DecodedIdToken
}

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (
  req: EnhancedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log("Check if request is authorized with Firebase ID token")

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    // eslint-disable-next-line no-underscore-dangle
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    )
    res.status(403).send("Unauthorized")
    return
  }

  let idToken
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "Authorization" header')
    // Read the ID Token from the Authorization header.
    // eslint-disable-next-line prefer-destructuring
    idToken = req.headers.authorization.split("Bearer ")[1]
  } else if (req.cookies) {
    console.log('Found "__session" cookie')
    // Read the ID Token from cookie.
    // eslint-disable-next-line no-underscore-dangle
    idToken = req.cookies.__session
  } else {
    // No cookie
    res.status(403).send("Unauthorized")
    return
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken)
    console.log("ID Token correctly decoded", decodedIdToken)
    req.user = decodedIdToken
    // Sentry.configureScope((scope) => {
    //   scope.setUser({ id: req.user!.uid, username: req.user!.phoneNumber })
    // })
    next()
    return
  } catch (error) {
    console.error("Error while verifying Firebase ID token:", error)
    res.status(403).send("Unauthorized")
  }
}

const api = (): express.Application => {
  const app = express()

  // app.use(Sentry.Handlers.requestHandler())

  // Automatically allow cross-origin requests
  app.use(cors({ origin: true }))
  app.use(cookieParser())
  app.use(validateFirebaseIdToken)

  app.get("/hello", (req: EnhancedRequest, res) => {
    res.send(`Hello ${req.user?.email}`)
  })

  // app.use(Sentry.Handlers.errorHandler())

  return app
}

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
// Expose Express API as a single Cloud Function
export default api
