"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGameById = getGameById;
exports.getGamesPaginated = getGamesPaginated;
exports.joinGame = joinGame;
exports.leaveGame = leaveGame;
exports.createGame = createGame;
exports.deleteGame = deleteGame;

var _server = require("../../server");

var scoreDataSource = _interopRequireWildcard(require("../scores/dataSource"));

var freeSpinDataSource = _interopRequireWildcard(require("../freeSpins/dataSource"));

var _utils = require("../../utils");

var _moment = _interopRequireDefault(require("moment"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let games = [];
let parsedData;
let resultObj = {};
const collectionName = "games";

function getGameById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("A game with the id does not exist!")
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

function getGamesPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = _server.db.collection(collectionName);

    var queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").limit(limit);

    return _server.db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        games = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            games.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: games,
            cursor: games.length > 0 ? games[games.length - 1].id : null,
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
        games = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = (0, _utils.transformFirestoreToJson)(doc);
            games.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: games,
            cursor: games.length > 0 ? games[games.length - 1].id : null,
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
        error: new Error("An error occured while attempting to get games")
      };
      return resultObj;
    });
  }
}

function joinGame(_x, _x2) {
  return _joinGame.apply(this, arguments);
}

function _joinGame() {
  _joinGame = _asyncToGenerator(function* (id, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Game does not exist",
        code: 404
      };
      return resultObj;
    }

    if (current_game.data.state != "Created") {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot join game that has already started",
        code: 401
      };
    }

    if (current_game.data.player_ids.includes(user_id)) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot join game that your are already a part of",
        code: 401
      };
    }

    return _server.db.collection(collectionName).doc(current_game.data.id).update({
      player_ids: current_game.data.player_ids.concat([user_id])
    }).then(
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      ["game", 1, 2].forEach(
      /*#__PURE__*/
      function () {
        var _ref5 = _asyncToGenerator(function* (el) {
          if (el == "game") {
            yield scoreDataSource.createScore("game", 0, current_game.data.id, user_id);
          } else {
            yield scoreDataSource.createScore("round", el, current_game.data.id, user_id);
          }
        });

        return function (_x8) {
          return _ref5.apply(this, arguments);
        };
      }());
      yield freeSpinDataSource.createFreeSpin(current_game.data.id, user_id);
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully joined game",
        code: 200
      };
    })).catch(error => {
      console.log(error);

      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message: "The user requesting deletion is not the owner of the game and therefore unauthorized",
          code: 401
        };
      } else if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A game with that id does not exist",
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
  });
  return _joinGame.apply(this, arguments);
}

function leaveGame(_x3, _x4) {
  return _leaveGame.apply(this, arguments);
}

function _leaveGame() {
  _leaveGame = _asyncToGenerator(function* (id, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Game does not exist",
        code: 404
      };
      return resultObj;
    }

    if (!current_game.data.player_ids.includes(user_id)) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot leave a game that your are not already a part of",
        code: 401
      };
    }

    var removed_player = [];
    current_game.data.player_ids.forEach(el => {
      if (el != user_id) {
        removed_player.push(el);
      }
    });
    return _server.db.collection(collectionName).doc(current_game.data.id).update({
      player_ids: removed_player
    }).then(
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      yield _server.db.collection("scores").where("game_id", "==", current_game.data.id).where("owner_id", "==", user_id).get().then(snapshot => {
        snapshot.forEach(scoreDoc => {
          scoreDoc.ref.delete();
        });
      });
      yield _server.db.collection("answers").where("game_id", "==", current_game.data.id).where("owner_id", "==", user_id).get().then(snapshot => {
        snapshot.forEach(answerDoc => {
          answerDoc.ref.delete();
        });
      });
      yield _server.db.collection("votes").where("game_id", "==", current_game.data.id).where("owner_id", "==", user_id).get().then(snapshot => {
        snapshot.forEach(voteDoc => {
          voteDoc.ref.delete();
        });
      });
      yield _server.db.collection("free_spins").where("game_id", "==", current_game.data.id).where("owner_id", "==", user_id).get().then(snapshot => {
        snapshot.forEach(freeSpinDoc => {
          freeSpinDoc.ref.delete();
        });
      });
      resultObj = {
        referenceId: id,
        status: "Success",
        message: "Successfully left game",
        code: 200
      };
      return resultObj;
    })).catch(error => {
      console.log(error);

      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message: "The user requesting deletion is not the owner of the game and therefore unauthorized",
          code: 401
        };
      } else if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A game with that id does not exist",
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
  });
  return _leaveGame.apply(this, arguments);
}

function createGame(name, question_categories, owner_id) {
  return _server.db.collection(collectionName).add({
    current_spin: 0,
    name: name,
    question_categories: question_categories,
    selected_question: null,
    player_ids: [owner_id],
    round: 0,
    state: "Created",
    sub_state: "Waiting",
    owner_id: owner_id,
    answer_timeout: 30
  }).then(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (docRef) {
      ["game", 1, 2].forEach(
      /*#__PURE__*/
      function () {
        var _ref2 = _asyncToGenerator(function* (el) {
          if (el == "game") {
            yield scoreDataSource.createScore("game", 0, docRef.id, owner_id);
          } else {
            yield scoreDataSource.createScore("round", el, docRef.id, owner_id);
          }
        });

        return function (_x6) {
          return _ref2.apply(this, arguments);
        };
      }());
      yield freeSpinDataSource.createFreeSpin(docRef.id, owner_id);
      return _server.db.collection(collectionName).doc(docRef.id).get().then(
      /*#__PURE__*/
      function () {
        var _ref3 = _asyncToGenerator(function* (doc) {
          parsedData = (0, _utils.transformFirestoreToJson)(doc);
          resultObj = {
            data: parsedData,
            error: null
          };
          return resultObj;
        });

        return function (_x7) {
          return _ref3.apply(this, arguments);
        };
      }());
    });

    return function (_x5) {
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

function deleteGame(id, userId) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      throw new Error("Document does not exist");
    }

    if (userId != (0, _utils.transformFirestoreToJson)(doc).owner_id) {
      throw new Error("Unauthorized");
    }

    if (doc.exists) {
      var parsedData = (0, _utils.transformFirestoreToJson)(doc);
      return doc.ref.delete().then(() => {
        _server.db.collection("scores").where("game_id", "==", parsedData.id).get().then(snapshot => {
          snapshot.forEach(scoreDoc => {
            scoreDoc.ref.delete();
          });
        });

        _server.db.collection("answers").where("game_id", "==", parsedData.id).get().then(snapshot => {
          snapshot.forEach(answerDoc => {
            answerDoc.ref.delete();
          });
        });

        _server.db.collection("votes").where("game_id", "==", parsedData.id).get().then(snapshot => {
          snapshot.forEach(voteDoc => {
            voteDoc.ref.delete();
          });
        });

        return _server.db.collection("free_spins").where("game_id", "==", parsedData.id).get().then(snapshot => {
          snapshot.forEach(freeSpinDoc => {
            freeSpinDoc.ref.delete();
          });
        });
      });
    }
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully deleted game",
      code: 200
    };
  }).catch(error => {
    console.log(error);

    if (error.message == "Unauthorized") {
      return {
        referenceId: id,
        status: "Failure",
        message: "The user requesting deletion is not the owner of the game and therefore unauthorized",
        code: 401
      };
    } else if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "A game with that id does not exist",
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