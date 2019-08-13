const admin = require("firebase-admin");
var serviceAccount = require("./utils/jwt.keys.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseUrl: "https://wheelofjeopardy.firebaseio.com"
});
export const db = admin.firestore();
const path = require("path");
import express from "express";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import cookieParser from "cookie-parser";
import schema from "./schema";
const secureCompare = require("secure-compare");

const validateFirebaseIdToken = (req, res, next) => {
  console.log(req.headers);
  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !req.cookies.__session
  ) {
    res.status(403).send("Unauthorized");
    return;
  }
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    idToken = req.cookies.__session;
  }
  console.log(idToken);
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(async decodedIdToken => {
      decodedIdToken["id"] = decodedIdToken.uid;
      return next();
    })
    .catch(error => {
      console.error("Error while verifying Firebase Id token:", error);
      res.status(403).send("Unauthorized");
    });
};

const app = express();

app.use(cookieParser());

app.post(
  "/graphql",
  validateFirebaseIdToken,
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json(),
  graphqlExpress(req => ({
    schema,
    context: { user: req.user, ip: req.userIp }
  }))
);

app.get(
  "/graphiql",
  validateFirebaseIdToken,
  graphiqlExpress({
    endpointURL: "/graphql"
  })
);

export { app };
