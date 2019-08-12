export function transformFirestoreToJson(doc) {
  var transformedDoc = {};
  transformedDoc.id = doc.id;
  Object.assign(transformedDoc, doc.data());
  return transformedDoc;
}
