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
  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Brearer ")) &&
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
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(async decodedIdToken => {
      decodedIdToken["id"] = decodedIdToken.uid;
      req.user = decodedIdToken;
      var userDoc = await db
        .collection("dev_users")
        .doc(decodedIdToken.uid)
        .get()
        .catch(err => console.log(err));
      if (userDoc.exists) {
        if (
          new Date().getTime() - userDoc.data().lastActivity >
          1000 * 60 * 60
        ) {
          await db
            .collection("dev_users")
            .doc(decodedIdToken.uid)
            .update({
              lastActivity: new Date().getTime()
            })
            .catch(err => {
              console.log(err);
            });
        }
      }
      req.userIp = req.connection.remoteAddress;
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
