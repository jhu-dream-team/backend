"use strict";

var _util = _interopRequireDefault(require("util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function noDocumentWithIdError(code, message) {
  Error.captureStackTrace(this, noDocumentWithIdError);
  this.name = noDocumentWithIdError.name;
  this.code = code;
  this.message = message || "A document with that id does not exist!";
}

_util.default.inherits(noDocumentWithIdError, Error);

module.exports = noDocumentWithIdError;