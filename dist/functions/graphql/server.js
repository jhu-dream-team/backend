"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.app = exports.db = void 0;

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _schema = _interopRequireDefault(require("./schema"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const functions = require("firebase-functions");

const admin = require("firebase-admin");

const db = admin.firestore();
exports.db = db;

const path = require("path");

const graphqlHTTP = require('express-graphql');

const secureCompare = require("secure-compare");

const validateFirebaseIdToken = (req, res, next) => {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) && !req.cookies.__session) {
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    idToken = req.cookies.__session;
  }

  admin.auth().verifyIdToken(idToken).then(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (decodedIdToken) {
      decodedIdToken["id"] = decodedIdToken.uid;
      req.user = decodedIdToken;
      var userDoc = yield db.collection("users").doc(decodedIdToken.uid).get().catch(err => console.log(err));

      if (userDoc.exists) {
        if (new Date().getTime() - userDoc.data().lastActivity > 1000 * 60 * 60) {
          yield db.collection("users").doc(decodedIdToken.uid).update({
            lastActivity: new Date().getTime()
          }).catch(err => {
            console.log(err);
          });
        }
      }

      req.userIp = req.connection.remoteAddress;
      return next();
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }()).catch(error => {
    console.error("Error while verifying Firebase Id token:", error);
    res.status(403).send("Unauthorized");
  });
};

const app = (0, _express.default)();
exports.app = app;
app.use((0, _cookieParser.default)());
app.post("/graphql", validateFirebaseIdToken, _bodyParser.default.urlencoded({
  extended: true
}), _bodyParser.default.json(), graphqlHTTP(req => ({
  schema: _schema.default,
  context: {
    user: req.user,
    ip: req.userIp
  },
  graphiql: false
})));
app.use("/graphiql", validateFirebaseIdToken, _bodyParser.default.urlencoded({
  extended: true
}), _bodyParser.default.json(), graphqlHTTP(req => ({
  schema: _schema.default,
  context: {
    user: req.user,
    ip: req.userIp
  },
  graphiql: true
})));