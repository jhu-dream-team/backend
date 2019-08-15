const functions = require("firebase-functions");
const admin = require("firebase-admin");
export const db = admin.firestore();
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import schema from "./schema";
import expressPlayground from "graphql-playground-middleware-express";
import { defaultPlaygroundOptions } from "apollo-server-express";
const { ApolloServer } = require("apollo-server-express");

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

const server = new ApolloServer({
  typeDefs: schema.typeDefs,
  resolvers: schema.resolvers,
  introspection: true,
  playground: false,
  context: ({ req }) => ({
    user: req.user,
    ip: req.userIp
  })
});

const app = express();

app.use(cors());

app.use(cookieParser());

app.use(validateFirebaseIdToken);

app.use("/graphiql", (req, res, next) => {
  const headers = JSON.stringify({
    authorization: req.headers.authorization || req.cookies.__session
  });
  expressPlayground({
    endpoint: `/graphql?headers=${encodeURIComponent(headers)}`,
    settings: {
      ...defaultPlaygroundOptions.settings,
      "request.credentials": "include"
    }
  })(req, res, next);
});

server.applyMiddleware({ app, path: "/graphql" });

export { app };
