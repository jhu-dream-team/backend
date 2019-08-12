import util from "util";

function noDocumentWithIdError(code, message) {
  Error.captureStackTrace(this, noDocumentWithIdError);
  this.name = noDocumentWithIdError.name;
  this.code = code;
  this.message = message || "A document with that id does not exist!";
}

util.inherits(noDocumentWithIdError, Error);

module.exports = noDocumentWithIdError;
