"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.graphqlExpress = graphqlExpress;
exports.graphqlResponseHandler = exports.extensionsFilter = exports.storeInCache = exports.getFromCacheIfAny = exports.createLRUCache = void 0;

var _apolloServerCore = require("apollo-server-core");

var express = _interopRequireWildcard(require("express"));

var _apolloServerExpress = require("apollo-server-express");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var LRU = require("lru-cache");

var sha256 = require("hash.js/lib/hash/sha/256");

const createLRUCache = (options = {
  size: 50000000
}) => {
  const cache = LRU({
    max: options.size,
    length: (n, key) => n.length + key.length
  });
  return {
    get(key) {
      return _asyncToGenerator(function* () {
        return cache.get(key);
      })();
    },

    set(key, value, maxAge) {
      return _asyncToGenerator(function* () {
        if (maxAge) {
          cache.set(key, value, maxAge);
        } else {
          cache.set(key, value);
        }
      })();
    }

  };
};

exports.createLRUCache = createLRUCache;

const isPersistedQuery = data => {
  if (data.extensions) {
    const payload = JSON.parse(data.extensions);
    return payload.persistedQuery;
  }

  return null;
};

const hashPostBody = query => {
  const q = query.replace(/\s+/g, "");
  const key = sha256().update(q).digest("hex");
  return key;
};

const extractCacheKey = query => {
  return `${query.version}.${query.sha256Hash}`;
};

const removeExtensions = obj => {
  const cachedValue = JSON.parse(obj);
  delete cachedValue.extensions;
  return JSON.stringify(cachedValue);
};

const sendContent = (res, value, cacheHit) => {
  res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(value, "utf8").toString());
  res.write(value);
  res.end();
};

const getFromCacheIfAny = store =>
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (req, res, next) {
    const {
      method
    } = req;
    const data = req.method == "POST" ? req.body : req.query;
    const pQuery = isPersistedQuery(data);

    if (method === "POST" && data.query && data.query.trim().indexOf("query") === 0) {
      const value = yield store.get(hashPostBody(data.query));

      if (value) {
        const {
          payload
        } = JSON.parse(value);
        sendContent(res, payload, true);
        return;
      }
    } else if (method === "GET" && pQuery) {
      const value = yield store.get(extractCacheKey(pQuery));

      if (value) {
        const {
          duration,
          at,
          payload
        } = JSON.parse(value);
        const durationLeft = Math.round(duration / 1000 - (Date.now() - at) / 1000);
        res.setHeader("Cache-Control", `public, max-age=${durationLeft}, s-maxage=${durationLeft}`);
        sendContent(res, payload, true);
        return;
      }
    }

    if (method === "GET" && pQuery && !data.query) {
      sendContent(res, JSON.stringify({
        errors: [{
          message: "PersistedQueryNotFound"
        }]
      }));
      return;
    }

    next();
  });

  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.getFromCacheIfAny = getFromCacheIfAny;

const storeInCache = store =>
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* (req, res, next) {
    const {
      method
    } = req;
    const data = req.method === "POST" ? req.body : req.query;
    const pQuery = isPersistedQuery(data);

    if (method === "GET" && pQuery || method === "POST" && data.query) {
      const gqlData = res["gqlResponse"];
      const extensions = JSON.parse(gqlData).extensions;

      if (extensions && extensions.cacheControl) {
        const minAge = extensions.cacheControl.hints.reduce((min, p) => p.maxAge < min ? p.maxAge : min, 60);
        const minAgeInMs = minAge * 1000;
        const key = method === "GET" ? extractCacheKey(pQuery) : hashPostBody(data.query);
        yield store.set(key, JSON.stringify({
          payload: removeExtensions(gqlData),
          at: Date.now(),
          duration: minAgeInMs
        }), minAgeInMs);
      }
    }

    next();
  });

  return function (_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

exports.storeInCache = storeInCache;

const extensionsFilter = (req, res, next) => {
  res["gqlResponse"] = removeExtensions(res["gqlResponse"]);
  next();
};

exports.extensionsFilter = extensionsFilter;

const graphqlResponseHandler = (req, res, next) => {
  sendContent(res, res["gqlResponse"]);
};

exports.graphqlResponseHandler = graphqlResponseHandler;

function graphqlExpress(options) {
  if (!options) {
    throw new Error("Apollo Server requires options.");
  }

  if (arguments.length > 1) {
    // TODO: test this
    throw new Error(`Apollo Server expects exactly one argument, got ${arguments.length}`);
  }

  const graphqlHandler = (req, res, next) => {
    (0, _apolloServerCore.runHttpQuery)([req, res], {
      method: req.method,
      options: options,
      query: req.method === "POST" ? req.body : req.query
    }).then(gqlResponse => {
      res["gqlResponse"] = gqlResponse;
      next();
    }, error => {
      if ("HttpQueryError" !== error.name) {
        return next(error);
      }

      if (error.headers) {
        Object.keys(error.headers).forEach(header => {
          res.setHeader(header, error.headers[header]);
        });
      }

      res.statusCode = error.statusCode;
      res.write(error.message);
      res.end();
    });
  };

  return graphqlHandler;
}