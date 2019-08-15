"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getQuestionCategoryById = getQuestionCategoryById;
exports.getQuestionCategoriesByGameId = getQuestionCategoriesByGameId;
exports.getQuestionCategoriesPaginated = getQuestionCategoriesPaginated;
exports.createQuestionCategory = createQuestionCategory;
exports.updateQuestionCategory = updateQuestionCategory;
exports.deleteQuestionCategory = deleteQuestionCategory;

var _server = require("../../server");

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var _utils = require("../../utils");

var _moment = _interopRequireDefault(require("moment"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let question_categories = [];
let parsedData;
let resultObj = {};
const collectionName = "question_categories";

function getQuestionCategoryById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("A question category with the id does not exist!")
      };
      return resultObj;
    }

    var parsedData = (0, _utils.transformFirestoreToJson)(doc);
    resultObj = {
      data: parsedData,
      error: null
    };
    return resultObj;
  });
}

function getQuestionCategoriesByGameId(_x, _x2, _x3) {
  return _getQuestionCategoriesByGameId.apply(this, arguments);
}

function _getQuestionCategoriesByGameId() {
  _getQuestionCategoriesByGameId = _asyncToGenerator(function* (game_id, limit, after) {
    if (after == undefined || after == null) {
      var countRef = null;
      var queryRef = null;
      queryRef = _server.db.collection(collectionName).orderBy("createdAt", "desc").limit(limit);
      countRef = _server.db.collection(collectionName);
      return _server.db.runTransaction(transaction => {
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          question_categories = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = (0, _utils.transformFirestoreToJson)(doc);
              question_categories.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: question_categories,
              cursor: question_categories.length > 0 ? question_categories[question_categories.length - 1].id : null,
              count: countSnapshot.size,
              error: null
            };
            return resultObj;
          });
        });
      });
    } else {
      var countRef = null;
      var queryRef = null;
      queryRef = _server.db.collection(collectionName).orderBy("createdAt", "desc").startAt(doc).offset(1).limit(limit);
      countRef = _server.db.collection(collectionName);
      return _server.db.runTransaction(transaction => {
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          question_categories = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = (0, _utils.transformFirestoreToJson)(doc);
              question_categories.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: question_categories,
              cursor: question_categories.length > 0 ? question_categories[question_categories.length - 1].id : null,
              count: countSnapshot.size,
              error: null
            };
            return resultObj;
          });
        });
      }).catch(error => {
        console.log(error);
        resultObj = {
          data: null,
          cursor: null,
          error: new Error("An error occured while attempting to get question categories")
        };
        return resultObj;
      });
    }
  });
  return _getQuestionCategoriesByGameId.apply(this, arguments);
}

function getQuestionCategoriesPaginated(_x4, _x5, _x6) {
  return _getQuestionCategoriesPaginated.apply(this, arguments);
}

function _getQuestionCategoriesPaginated() {
  _getQuestionCategoriesPaginated = _asyncToGenerator(function* (limit, after, user_id) {
    let user;

    if (user_id != null) {
      try {
        user = yield profileDataSource.getUserById(user_id);

        if (user.error) {
          throw error;
        }
      } catch (e) {
        return {
          data: null,
          cursor: null,
          error: new Error("Error resolving the user object of the requesting user")
        };
      }
    }

    if (after == undefined || after == null) {
      var countRef = null;
      var queryRef = null;

      if (user != null) {
        queryRef = _server.db.collection(collectionName).where("owner_id", "==", user_id).orderBy("updatedAt", "desc").limit(limit);
        countRef = _server.db.collection(collectionName).where("owner_id", "==", user_id);
      } else {
        queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").limit(limit);
        countRef = _server.db.collection(collectionName);
      }

      return _server.db.runTransaction(transaction => {
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          question_categories = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = (0, _utils.transformFirestoreToJson)(doc);
              question_categories.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: question_categories,
              cursor: question_categories.length > 0 ? question_categories[question_categories.length - 1].id : null,
              count: countSnapshot.size,
              error: null
            };
            return resultObj;
          });
        });
      });
    } else {
      var countRef = null;
      var queryRef = null;

      if (user != null) {
        queryRef = _server.db.collection(collectionName).where("owner_id", "==", user_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);
        countRef = _server.db.collection(collectionName).where("owner_id", "==", user_id);
      } else {
        queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);
        countRef = _server.db.collection(collectionName);
      }

      return _server.db.runTransaction(transaction => {
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          question_categories = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = (0, _utils.transformFirestoreToJson)(doc);
              question_categories.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: question_categories,
              cursor: question_categories.length > 0 ? question_categories[question_categories.length - 1].id : null,
              count: countSnapshot.size,
              error: null
            };
            return resultObj;
          });
        });
      }).catch(error => {
        console.log(error);
        resultObj = {
          data: null,
          cursor: null,
          error: new Error("An error occured while attempting to get question categories")
        };
        return resultObj;
      });
    }
  });
  return _getQuestionCategoriesPaginated.apply(this, arguments);
}

function createQuestionCategory(_x7, _x8) {
  return _createQuestionCategory.apply(this, arguments);
}

function _createQuestionCategory() {
  _createQuestionCategory = _asyncToGenerator(function* (name, user_id) {
    return _server.db.collection(collectionName).add({
      name: name,
      createdAt: (0, _utils.getCurrentUnix)(),
      updatedAt: (0, _utils.getCurrentUnix)(),
      owner_id: user_id
    }).then(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* (docRef) {
        return _server.db.collection(collectionName).doc(docRef.id).get().then(
        /*#__PURE__*/
        function () {
          var _ref2 = _asyncToGenerator(function* (doc) {
            parsedData = (0, _utils.transformFirestoreToJson)(doc);
            resultObj = {
              data: parsedData,
              error: null
            };
            return resultObj;
          });

          return function (_x10) {
            return _ref2.apply(this, arguments);
          };
        }());
      });

      return function (_x9) {
        return _ref.apply(this, arguments);
      };
    }()).catch(err => {
      console.log(err);
      resultObj = {
        data: null,
        error: new Error("An error occured while attempting to create the question category")
      };
      return resultObj;
    });
  });
  return _createQuestionCategory.apply(this, arguments);
}

function updateQuestionCategory(id, name, userId) {
  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    var questionCategoryDoc = transaction.get(docRef);
    return questionCategoryDoc.then(doc => {
      if (userId != (0, _utils.transformFirestoreToJson)(doc).owner_id) {
        throw new Error("Unauthorized");
      }

      if (doc.exists) {
        var parsedData = (0, _utils.transformFirestoreToJson)(doc);
        transaction.update(docRef, {
          name: name,
          updatedAt: (0, _utils.getCurrentUnix)()
        });
      } else {
        throw new Error("Document does not exist");
      }
    });
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully updated question category",
      code: 200
    };
  }).catch(error => {
    console.log(error);

    if (error.message == "Unauthorized") {
      return {
        referenceId: id,
        status: "Failure",
        message: "The user requesting update is not the owner of the question category and therefore unauthorized",
        code: 401
      };
    } else if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "An question category with that id does not exist",
        code: 404
      };
    } else {
      return {
        referenceId: id,
        status: "Failure",
        message: "An unknown error has occured.",
        code: 500
      };
    }
  });
}

function deleteQuestionCategory(id, userId) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      throw new Error("Document does not exist");
    }

    if (userId != (0, _utils.transformFirestoreToJson)(doc).owner_id) {
      throw new Error("Unauthorized");
    }

    if (doc.exists) {
      return doc.ref.delete().then(() => {
        return _server.db.collection("questions").where("question_category_id", "==", id).get().then(snapshot => {
          snapshot.forEach(doc => {
            doc.ref.delete();
          });
        });
      });
    }
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully deleted question category",
      code: 200
    };
  }).catch(error => {
    console.log(error);

    if (error.message == "Unauthorized") {
      return {
        referenceId: id,
        status: "Failure",
        message: "The user requesting deletion is not the owner of the queston category and therefore unauthorized",
        code: 401
      };
    } else if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "A question category with that id does not exist",
        code: 404
      };
    } else {
      return {
        referenceId: id,
        status: "Failure",
        message: "An unknown error has occured.",
        code: 500
      };
    }
  });
}