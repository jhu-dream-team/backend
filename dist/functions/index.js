"use strict";

var _server = require("./graphql/server");

const cors = require("micro-cors")();

module.exports = cors(_server.app);