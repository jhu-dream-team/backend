"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getScoreById = getScoreById;
exports.getScoreByReferences = getScoreByReferences;
exports.getScoreByGameId = getScoreByGameId;
exports.getScoreByGameIdPlayerIdRound = getScoreByGameIdPlayerIdRound;
exports.getScoresPaginated = getScoresPaginated;
exports.createScore = createScore;
exports.updateScore = updateScore;
exports.getScoresByProfileId = getScoresByProfileId;

var _server = require("../../server");

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var _utils = require("../../utils");

var _moment = _interopRequireDefault(require("moment"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let scores = [];
let parsedData;
let resultObj = {};
const collectionName = "scores";

function getScoreById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("A score with the id does not exist!")
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

function getScoreByReferences(reference_ids) {
  var references = [];
  reference_ids.forEach(el => {
    var referenced_score = getScoreById(el);

    if (referenced_score.error == null) {
      references.push(referenced_score.data);
    }
  });
  resultObj = {
    data: references,
    error: null
  };
  return resultObj;
}

function getScoreByGameId(game_id, limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName).where("game_id", "==", game_id);

    var queryRef = _server.db.collection(collectionName).where("game_id", "==", game_id).orderBy("createdAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            scores.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: scores,
            cursor: scores.length > 0 ? scores[scores.length - 1].id : null,
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
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            scores.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: scores,
            cursor: scores.length > 0 ? scores[scores.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get scores")
      };
      return resultObj;
    });
  }
}

function getScoreByGameIdPlayerIdRound(game_id, player_id, round) {
  return _server.db.collection(collectionName).where("game_id", "==", game_id).where("owner_id", "==", player_id).where("round", "==", round).get().then(snapshot => {
    if (snapshot.size < 1) {
      throw Error("No score found");
    }

    return {
      data: (0, _utils.transformFirestoreToJson)(snapshot.docs[0]),
      error: null
    };
  }).catch(err => {
    return {
      data: null,
      error: err
    };
  });
}

function getScoresPaginated(limit, after, user_id) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName).where("owner_id", "==", user_id);

    var queryRef = _server.db.collection(collectionName).where("owner_id", "==", user_id).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            scores.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: scores,
            cursor: scores.length > 0 ? scores[scores.length - 1].id : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = _server.db.collection(collectionName).where("owner_id", "==", user_id);

    var queryRef = _server.db.collection(collectionName).where("owner_id", "==", user_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            scores.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: scores,
            cursor: scores.length > 0 ? scores[scores.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get scores")
      };
      return resultObj;
    });
  }
}

function createScore(type, round, game_id, owner_id) {
  return _server.db.collection(collectionName).add({
    type: type,
    value: 0.0,
    modifier: 1.0,
    round: round,
    game_id: game_id,
    owner_id: owner_id,
    createdAt: (0, _utils.getCurrentUnix)(),
    updatedAt: (0, _utils.getCurrentUnix)()
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

        return function (_x2) {
          return _ref2.apply(this, arguments);
        };
      }());
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }()).catch(err => {
    console.log(err);
    resultObj = {
      data: null,
      error: new Error("An error occured while attempting to create the score")
    };
    return resultObj;
  });
}

function updateScore(id, args) {
  var updateInfo = {};

  for (var property in args) {
    if (args.hasOwnProperty(property)) {
      updateInfo[property] = args[property];
    }
  }

  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (doc.exists) {
      doc.ref.update(Object.assign(updateInfo, {
        updatedAt: (0, _utils.getCurrentUnix)()
      }));
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully updated score",
        code: 200
      };
    } else {
      throw new Error("Document does not exist");
    }
  }).catch(error => {
    console.log(error);

    if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "A score with that id does not exist",
        code: 404
      };
    } else {
      console.log(error);
      return {
        referenceId: id,
        status: "Failure",
        message: "An unknown error occured",
        code: 500
      };
    }
  });
}

function getScoresByProfileId(profile_id, limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName).where("owner_id", "==", profile_id);

    var queryRef = _server.db.collection(collectionName).where("owner_id", "==", profile_id).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            scores.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: scores,
            cursor: scores.length > 0 ? scores[scores.length - 1].id : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = _server.db.collection(collectionName).where("owner_id", "==", profile_id);

    var queryRef = _server.db.collection(collectionName).where("owner_id", "==", profile_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            scores.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: scores,
            cursor: scores.length > 0 ? scores[scores.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get scores")
      };
      return resultObj;
    });
  }
}