"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.app = exports.db = void 0;

var _cors = _interopRequireDefault(require("cors"));

var _express = _interopRequireDefault(require("express"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _schema = _interopRequireDefault(require("./schema"));

var _graphqlPlaygroundMiddlewareExpress = _interopRequireDefault(require("graphql-playground-middleware-express"));

var _apolloServerExpress = require("apollo-server-express");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const functions = require("firebase-functions");

const admin = require("firebase-admin");

const db = admin.firestore();
exports.db = db;

const {
  ApolloServer
} = require("apollo-server-express");

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

const server = new ApolloServer({
  typeDefs: _schema.default.typeDefs,
  resolvers: _schema.default.resolvers,
  introspection: true,
  playground: false,
  context: ({
    req
  }) => ({
    user: req.user,
    ip: req.userIp
  })
});
const app = (0, _express.default)();
exports.app = app;
app.use((0, _cors.default)());
app.use((0, _cookieParser.default)());
app.use(validateFirebaseIdToken);
app.use("/graphiql", (req, res, next) => {
  const headers = JSON.stringify({
    authorization: req.headers.authorization || req.cookies.__session
  });
  (0, _graphqlPlaygroundMiddlewareExpress.default)({
    endpoint: `/graphql?headers=${encodeURIComponent(headers)}`,
    settings: _objectSpread({}, _apolloServerExpress.defaultPlaygroundOptions.settings, {
      "request.credentials": "include"
    })
  })(req, res, next);
});
server.applyMiddleware({
  app,
  path: "/graphql"
});