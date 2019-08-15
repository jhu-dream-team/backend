"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVoteByAnswerId = getVoteByAnswerId;
exports.getVoteById = getVoteById;
exports.getVotesByAnswer = getVotesByAnswer;
exports.createVote = createVote;
exports.getVotesPaginated = getVotesPaginated;

var _server = require("../../server");

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var _utils = require("../../utils");

var _moment = _interopRequireDefault(require("moment"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let votes = [];
let parsedData;
let resultObj = {};
const collectionName = "votes";

function getVoteByAnswerId(_x) {
  return _getVoteByAnswerId.apply(this, arguments);
}

function _getVoteByAnswerId() {
  _getVoteByAnswerId = _asyncToGenerator(function* (answer_id) {
    return _server.db.collection(collectionName).where("answer_id", "==", answer_id).get().then(snapshot => {
      if (snapshot.docs.length == 0) {
        return {
          data: [],
          error: null
        };
      }

      votes = [];
      snapshot.forEach(doc => {
        votes.push((0, _utils.transformFirestoreToJson)(doc));
      });
      return {
        data: votes,
        error: null
      };
    }).catch(err => {
      return {
        data: null,
        error: err
      };
    });
  });
  return _getVoteByAnswerId.apply(this, arguments);
}

function getVoteById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("A vote with the id does not exist!")
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

function getVotesByAnswer(answer_id) {
  var votes = [];
  return _server.db.collection(collectionName).where("answer_id", "==", answer_id).get().then(snapshot => {
    snapshot.forEach(doc => {
      if (doc.exists) {
        var parsedData = (0, _utils.transformFirestoreToJson)(doc);
        votes.push(parsedData);
      }
    });
    resultObj = {
      data: votes,
      error: null
    };
    return resultObj;
  });
}

function createVote(answer_id, game_id, approve, user_id) {
  return _server.db.collection(collectionName).add({
    answer_id: answer_id,
    game_id: game_id,
    approve: approve,
    owner_id: user_id
  }).then(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (docRef) {
      return _server.db.collection(collectionName).doc(docRef.id).get().then(doc => {
        return {
          data: (0, _utils.transformFirestoreToJson)(doc),
          error: null
        };
      }).catch(err => {
        return {
          data: null,
          error: err
        };
      });
    });

    return function (_x2) {
      return _ref.apply(this, arguments);
    };
  }());
}

function getVotesPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName);

    var queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        votes = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            votes.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: votes,
            cursor: votes.length > 0 ? votes[votes.length - 1].id : null,
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
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        votes = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            votes.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: votes,
            cursor: votes.length > 0 ? votes[votes.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get votes")
      };
      return resultObj;
    });
  }
}