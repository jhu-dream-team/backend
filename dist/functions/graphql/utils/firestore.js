"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformFirestoreToJson = transformFirestoreToJson;

function transformFirestoreToJson(doc) {
  var transformedDoc = {};
  transformedDoc.id = doc.id;
  Object.assign(transformedDoc, doc.data());
  return transformedDoc;
}