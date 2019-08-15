"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAnswerByGameId = getAnswerByGameId;
exports.getAnswerByGameIdQuestionId = getAnswerByGameIdQuestionId;
exports.getAnswersByGameIdPaginated = getAnswersByGameIdPaginated;
exports.getAnswerById = getAnswerById;
exports.createAnswer = createAnswer;
exports.getAnswersPaginated = getAnswersPaginated;
exports.getAnswerByScoreId = getAnswerByScoreId;

var _server = require("../../server");

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var _utils = require("../../utils");

var _moment = _interopRequireDefault(require("moment"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

let answer = [];
let parsedData;
let resultObj = {};
const collectionName = "answers";

function getAnswerByGameId(game_id) {
  return _server.db.collection(collectionName).where("game_id", "==", game_id).get().then(snapshot => {
    if (snapshot.size < 1) {
      return [];
    }

    var answers = [];
    snapshot.forEach(doc => {
      answers.push((0, _utils.transformFirestoreToJson)(doc));
    });
    return answers;
  }).catch(err => {
    throw err;
  });
}

function getAnswerByGameIdQuestionId(game_id, question_id) {
  return _server.db.collection(collectionName).where("game_id", "==", game_id).where("question_id", "==", question_id).get().then(snapshot => {
    if (snapshot.size < 1) {
      return [];
    }

    var parsedData = (0, _utils.transformFirestoreToJson)(snapshot.docs[0]);
    return {
      data: parsedData,
      error: null
    };
  }).catch(err => {
    return {
      data: null,
      error: err
    };
  });
}

function getAnswersByGameIdPaginated(limit, after, game_id) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName).where("game_id", "==", game_id);

    var queryRef = _server.db.collection(collectionName).where("game_id", "==", game_id).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            answers.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: answers,
            cursor: answers.length > 0 ? answers[answers.length - 1].id : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = _server.db.collection(collectionName).where("game_id", "==", game_id);

    var queryRef = _server.db.collection(collectionName).where("game_id", "==", game_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);

    return _server.db.runTransaction(transaction => {
      var answerRef = transaction.get(queryRef);
      return answerRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            answers.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: answers,
            cursor: answers.length > 0 ? answers[answers.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get answers")
      };
      return resultObj;
    });
  }
}

function getAnswerById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("An answer with the id does not exist!")
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

function createAnswer(question_id, score_id, game_id, value, user_id) {
  return _server.db.collection(collectionName).add({
    value: value,
    award: 0.0,
    question_id: question_id,
    owner_id: user_id,
    score_id: score_id,
    game_id: game_id,
    deadline: 0,
    createdAt: (0, _utils.getCurrentUnix)(),
    updatedAt: (0, _utils.getCurrentUnix)()
  }).then(docRef => {
    return _server.db.collection(collectionName).doc(docRef.id).get().then(doc => {
      parsedData = (0, _utils.transformFirestoreToJson)(doc);
      resultObj = {
        data: parsedData,
        error: null
      };
      return resultObj;
    });
  });
}

function getAnswersPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName);

    var queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            answers.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: answers,
            cursor: answers.length > 0 ? answers[answers.length - 1].id : null,
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
      var answerRef = transaction.get(queryRef);
      return answerRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            answers.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: answers,
            cursor: answers.length > 0 ? answers[answers.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get answers")
      };
      return resultObj;
    });
  }
}

function getAnswerByScoreId(score_id, limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName).where("score_id", "==", score_id);

    var queryRef = _server.db.collection(collectionName).where("score_id", "==", score_id).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var answerRef = transaction.get(queryRef);
      return answerRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            answers.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: answers,
            cursor: answers.length > 0 ? answers[answer.length - 1].id : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = _server.db.collection(collectionName).where("score_id", "==", score_id);

    var queryRef = _server.db.collection(collectionName).where("score_id", "==", score_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);

    return _server.db.runTransaction(transaction => {
      var answerRef = transaction.get(queryRef);
      return answerRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            answers.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: answers,
            cursor: answers.length > 0 ? answers[answers.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get answers")
      };
      return resultObj;
    });
  }
}