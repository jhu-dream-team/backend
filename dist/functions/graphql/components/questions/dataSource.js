"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getQuestionById = getQuestionById;
exports.getRandomQuestionByCategory = getRandomQuestionByCategory;
exports.getQuestionsPaginated = getQuestionsPaginated;
exports.getQuestionsByCategoryPaginated = getQuestionsByCategoryPaginated;
exports.createQuestion = createQuestion;
exports.updateQuestion = updateQuestion;
exports.deleteQuestion = deleteQuestion;

var _server = require("../../server");

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var _utils = require("../../utils");

var _moment = _interopRequireDefault(require("moment"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let questions = [];
let parsedData;
let resultObj = {};
const collectionName = "questions";

function getQuestionById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("A question with the id does not exist!")
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

function getRandomQuestionByCategory(question_category_id) {
  return _server.db.collection(collectionName).where("question_category_id", "==", question_category_id).get().then(snapshot => {
    questions = [];
    snapshot.forEach(doc => {
      if (doc.exists) {
        var parsedData = (0, _utils.transformFirestoreToJson)(doc);
        questions.push(parsedData);
      }
    });
    var random_question_number = (0, _utils.getRandomInt)(questions.length - 1);
    resultObj = {
      data: questions[random_question_number],
      error: null
    };
    return resultObj;
  });
}

function getQuestionsPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName);

    var queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var questionRef = transaction.get(queryRef);
      return questionRef.then(snapshot => {
        questions = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            questions.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: questions,
            cursor: questions.length > 0 ? questions[questions.length - 1].id : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = _server.db.collection(collectionName);

    var queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);

    return _server.db.runTransaction(transaction => {
      var questionCategoryRef = transaction.get(queryRef);
      return questionCategoryRef.then(snapshot => {
        questions = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            questions.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: questions,
            cursor: questions.length > 0 ? questions[questions.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get questions")
      };
      return resultObj;
    });
  }
}

function getQuestionsByCategoryPaginated(question_category_id, limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName).where("question_category_id", "==", question_category_id);

    var queryRef = _server.db.collection(collectionName).where("question_category_id", "==", question_category_id).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var questionRef = transaction.get(queryRef);
      return questionRef.then(snapshot => {
        questions = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            questions.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: questions,
            cursor: questions.length > 0 ? questions[questions.length - 1].id : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = _server.db.collection(collectionName).where("question_category_id", "==", question_category_id);

    var queryRef = _server.db.collection(collectionName).where("question_category_id", "==", question_category_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);

    return _server.db.runTransaction(transaction => {
      var questionCategoryRef = transaction.get(queryRef);
      return questionCategoryRef.then(snapshot => {
        questions = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            questions.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: questions,
            cursor: questions.length > 0 ? questions[questions.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get questions")
      };
      return resultObj;
    });
  }
}

function createQuestion(_x, _x2, _x3, _x4, _x5) {
  return _createQuestion.apply(this, arguments);
}

function _createQuestion() {
  _createQuestion = _asyncToGenerator(function* (question, suggested_answer, max_points, question_category_id, user_id) {
    return _server.db.collection(collectionName).add({
      question: question,
      suggested_answer: suggested_answer,
      max_points: max_points,
      question_category_id: question_category_id,
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

          return function (_x7) {
            return _ref2.apply(this, arguments);
          };
        }());
      });

      return function (_x6) {
        return _ref.apply(this, arguments);
      };
    }()).catch(err => {
      console.log(err);
      resultObj = {
        data: null,
        error: new Error("An error occured while attempting to create the question")
      };
      return resultObj;
    });
  });
  return _createQuestion.apply(this, arguments);
}

function updateQuestion(id, args, userId) {
  var updateInfo = {};

  for (var property in args) {
    if (args.hasOwnProperty(property)) {
      updateInfo[property] = args[property];
    }
  }

  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    var questionDoc = transaction.get(docRef);
    return questionDoc.then(doc => {
      if (userId != (0, _utils.transformFirestoreToJson)(doc).owner_id) {
        throw new Error("Unauthorized");
      }

      if (doc.exists) {
        var parsedData = (0, _utils.transformFirestoreToJson)(doc);
        transaction.update(docRef, _objectSpread({}, updateInfo, {
          updatedAt: (0, _utils.getCurrentUnix)()
        }));
      } else {
        throw new Error("Document does not exist");
      }
    });
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully updated question",
      code: 200
    };
  }).catch(error => {
    console.log(error);

    if (error.message == "Unauthorized") {
      return {
        referenceId: id,
        status: "Failure",
        message: "The user requesting update is not the owner of the question and therefore unauthorized",
        code: 401
      };
    } else if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "A question with that id does not exist",
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

function deleteQuestion(id, userId) {
  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    var questionDoc = transaction.get(docRef);
    return questionDoc.then(doc => {
      if (userId != (0, _utils.transformFirestoreToJson)(doc).owner_id) {
        throw new Error("Unauthorized");
      }

      if (doc.exists) {
        transaction.delete(docRef);
      } else {
        throw new Error("Document does not exist");
      }
    });
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully deleted question",
      code: 200
    };
  }).catch(error => {
    if (error.message == "Unauthorized") {
      return {
        referenceId: id,
        status: "Failure",
        message: "The user requesting deletion is not the owner of the question and therefore unauthorized",
        code: 401
      };
    } else if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "A question with that id does not exist",
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