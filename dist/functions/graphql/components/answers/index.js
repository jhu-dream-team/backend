"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "answerSchema", {
  enumerable: true,
  get: function () {
    return _schema.default;
  }
});
Object.defineProperty(exports, "answerResolvers", {
  enumerable: true,
  get: function () {
    return _resolvers.default;
  }
});

var _schema = _interopRequireDefault(require("./schema"));

var _resolvers = _interopRequireDefault(require("./resolvers"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }