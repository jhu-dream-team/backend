const functions = require("firebase-functions");
const admin = require("firebase-admin");
export const db = admin.firestore();
const path = require("path");
const graphqlHTTP = require('express-graphql');
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import schema from "./schema";
const secureCompare = require("secure-compare");

const validateFirebaseIdToken = (req, res, next) => {
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
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(async decodedIdToken => {
      decodedIdToken["id"] = decodedIdToken.uid;
      req.user = decodedIdToken;
      var userDoc = await db
        .collection("users")
        .doc(decodedIdToken.uid)
        .get()
        .catch(err => console.log(err));
      if (userDoc.exists) {
        if (
          new Date().getTime() - userDoc.data().lastActivity >
          1000 * 60 * 60
        ) {
          await db
            .collection("users")
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
  graphqlHTTP(req => ({
    schema,
    context: { user: req.user, ip: req.userIp },
    graphiql: false
  }))
);

app.use(
  "/graphiql",
  validateFirebaseIdToken,
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json(),
  graphqlHTTP(req => ({
    schema,
    context: { user: req.user, ip: req.userIp },
    graphiql: true
  }))
);


export { app };
