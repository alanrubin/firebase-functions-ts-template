import { https, logger } from "firebase-functions"
import API from "./api"

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// eslint-disable-next-line import/prefer-default-export
export const helloWorld = https.onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true })
  response.send("Hello from Firebase!")
})

export const comments = https.onRequest(API())
