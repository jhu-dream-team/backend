import * as functions from "firebase-functions";
const admin = require("firebase-admin");
var serviceAccount = require("./jwt.keys.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wheelofjeopardy.firebaseio.com"
});
import { lazyModule } from "./tools/importer";

export const api = functions.https.onRequest(async (request, response) => {
  const { app } = await lazyModule(__dirname + "/graphql/server");
  app(request, response);
});
