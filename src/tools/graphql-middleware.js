import {
  GraphQLOptions,
  HttpQueryError,
  runHttpQuery
} from "apollo-server-core";
import * as express from "express";
import {
  ExpressGraphQLOptionsFunction,
  ExpressHandler
} from "apollo-server-express";
var LRU = require("lru-cache");
var sha256 = require("hash.js/lib/hash/sha/256");

export const createLRUCache = (options = { size: 50000000 }) => {
  const cache = LRU({
    max: options.size,
    length: (n, key) => n.length + key.length
  });

  return {
    async get(key) {
      return cache.get(key);
    },
    async set(key, value, maxAge) {
      if (maxAge) {
        cache.set(key, value, maxAge);
      } else {
        cache.set(key, value);
      }
    }
  };
};

const isPersistedQuery = data => {
  if (data.extensions) {
    const payload = JSON.parse(data.extensions);

    return payload.persistedQuery;
  }

  return null;
};

const hashPostBody = query => {
  const q = query.replace(/\s+/g, "");
  const key = sha256()
    .update(q)
    .digest("hex");

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

export const getFromCacheIfAny = store => async (req, res, next) => {
  const { method } = req;
  const data = req.method == "POST" ? req.body : req.query;
  const pQuery = isPersistedQuery(data);

  if (
    method === "POST" &&
    data.query &&
    data.query.trim().indexOf("query") === 0
  ) {
    const value = await store.get(hashPostBody(data.query));
    if (value) {
      const { payload } = JSON.parse(value);
      sendContent(res, payload, true);
      return;
    }
  } else if (method === "GET" && pQuery) {
    const value = await store.get(extractCacheKey(pQuery));

    if (value) {
      const { duration, at, payload } = JSON.parse(value);
      const durationLeft = Math.round(
        duration / 1000 - (Date.now() - at) / 1000
      );

      res.setHeader(
        "Cache-Control",
        `public, max-age=${durationLeft}, s-maxage=${durationLeft}`
      );

      sendContent(res, payload, true);
      return;
    }
  }

  if (method === "GET" && pQuery && !data.query) {
    sendContent(
      res,
      JSON.stringify({ errors: [{ message: "PersistedQueryNotFound" }] })
    );
    return;
  }

  next();
};

export const storeInCache = store => async (req, res, next) => {
  const { method } = req;
  const data = req.method === "POST" ? req.body : req.query;
  const pQuery = isPersistedQuery(data);
  if ((method === "GET" && pQuery) || (method === "POST" && data.query)) {
    const gqlData = res["gqlResponse"];
    const extensions = JSON.parse(gqlData).extensions;
    if (extensions && extensions.cacheControl) {
      const minAge = extensions.cacheControl.hints.reduce(
        (min, p) => (p.maxAge < min ? p.maxAge : min),
        60
      );

      const minAgeInMs = minAge * 1000;

      const key =
        method === "GET" ? extractCacheKey(pQuery) : hashPostBody(data.query);
      await store.set(
        key,
        JSON.stringify({
          payload: removeExtensions(gqlData),
          at: Date.now(),
          duration: minAgeInMs
        }),
        minAgeInMs
      );
    }
  }

  next();
};

export const extensionsFilter = (req, res, next) => {
  res["gqlResponse"] = removeExtensions(res["gqlResponse"]);
  next();
};

export const graphqlResponseHandler = (req, res, next) => {
  sendContent(res, res["gqlResponse"]);
};

export function graphqlExpress(options) {
  if (!options) {
    throw new Error("Apollo Server requires options.");
  }

  if (arguments.length > 1) {
    // TODO: test this
    throw new Error(
      `Apollo Server expects exactly one argument, got ${arguments.length}`
    );
  }

  const graphqlHandler = (req, res, next) => {
    runHttpQuery([req, res], {
      method: req.method,
      options: options,
      query: req.method === "POST" ? req.body : req.query
    }).then(
      gqlResponse => {
        res["gqlResponse"] = gqlResponse;
        next();
      },
      error => {
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
      }
    );
  };

  return graphqlHandler;
}
