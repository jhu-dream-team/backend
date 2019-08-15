"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGameById = getGameById;
exports.getGamesPaginated = getGamesPaginated;
exports.joinGame = joinGame;
exports.leaveGame = leaveGame;
exports.completeTurn = completeTurn;
exports.voteAnswer = voteAnswer;
exports.answerQuestion = answerQuestion;
exports.selectCategory = selectCategory;
exports.spinWheel = spinWheel;
exports.startGame = startGame;
exports.createGame = createGame;
exports.deleteGame = deleteGame;

var _server = require("../../server");

var voteDataSource = _interopRequireWildcard(require("../votes/dataSource"));

var scoreDataSource = _interopRequireWildcard(require("../scores/dataSource"));

var freeSpinDataSource = _interopRequireWildcard(require("../freeSpins/dataSource"));

var questionDataSource = _interopRequireWildcard(require("../questions/dataSource"));

var answerDataSource = _interopRequireWildcard(require("../answers/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

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

function getGamesPaginated(_x, _x2, _x3) {
  return _getGamesPaginated.apply(this, arguments);
}

function _getGamesPaginated() {
  _getGamesPaginated = _asyncToGenerator(function* (limit, after, user_id) {
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
      var queryRef = null;
      var countRef = null;

      if (user != null) {
        queryRef = _server.db.collection(collectionName).where("player_ids", "array-contains", user_id).orderBy("updatedAt", "desc").limit(limit);
        countRef = _server.db.collection(collectionName).where("player_ids", "array-contains", user_id);
      } else {
        countRef = _server.db.collection(collectionName);
        queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").limit(limit);
      }

      return _server.db.runTransaction(transaction => {
        var gameRef = transaction.get(queryRef);
        return gameRef.then(snapshot => {
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
      var queryRef = null;
      var countRef = null;

      if (user != null) {
        queryRef = _server.db.collection(collectionName).where("player_ids", "array-contains", user_id).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);
        countRef = _server.db.collection(collectionName).where("player_ids", "array-contains", user_id);
      } else {
        queryRef = _server.db.collection(collectionName).orderBy("updatedAt", "desc").startAt(doc).offset(1).limit(limit);
        countRef = _server.db.collection(collectionName);
      }

      return _server.db.runTransaction(transaction => {
        var gameRef = transaction.get(queryRef);
        return gameRef.then(snapshot => {
          games = [];
          snapshot.forEach(doc => {
            console.dir(doc);

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
  });
  return _getGamesPaginated.apply(this, arguments);
}

function joinGame(_x4, _x5) {
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
      return resultObj;
    }

    if (current_game.data.player_ids.includes(user_id)) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot join game that your are already a part of",
        code: 401
      };
      return resultObj;
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

        return function (_x26) {
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

function leaveGame(_x6, _x7) {
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
      return resultObj;
    }

    if (user_id == current_game.data.owner_id) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot leave a game of which you are the owner",
        code: 401
      };
      return resultObj;
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

function completeTurn(_x8, _x9) {
  return _completeTurn.apply(this, arguments);
}

function _completeTurn() {
  _completeTurn = _asyncToGenerator(function* (id, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      throw current_game.error;
    }

    if (current_game.data.sub_state != "Awaiting Completion By Player") {
      throw new Error("Wrong state");
    }

    if (current_game.data.player_ids[current_game.data.spins % current_game.data.player_ids.length] != user_id) {
      throw new Error("Unauthorized");
    }

    var round = current_game.data.round;
    var state = current_game.data.state;
    var answers = answerDataSource.getGameById(id).catch(err => {
      throw err;
    });

    if (current_game.data.spins == 49 || answers.data.length == 30) {
      if (round == 1) {
        round = 2;
      } else {
        state = "Ended";
      }
    }

    return _server.db.collection(collectionName).doc(id).update({
      sub_state: "Waiting",
      spins: current_game.data.spins + 1,
      selected_question: null,
      current_spin: null,
      round: round,
      state: state
    });
  });
  return _completeTurn.apply(this, arguments);
}

function voteAnswer(_x10, _x11, _x12) {
  return _voteAnswer.apply(this, arguments);
}

function _voteAnswer() {
  _voteAnswer = _asyncToGenerator(function* (id, correct, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      return {
        referenceId: id,
        status: "Failed",
        message: current_game.error.message,
        code: 200
      };
    }

    if (current_game.data.sub_state != "Voting") {
      return {
        referenceId: id,
        status: "Failed",
        message: "You cannot vote for an answer when it is not time to vote",
        code: 401
      };
    }

    var current_question = yield questionDataSource.getQuestionById(current_game.data.current_question.id).catch(err => {
      return {
        referenceId: id,
        status: "Failed",
        message: err.message,
        code: 500
      };
    });
    var current_answer = yield answerDataSource.getAnswerByGameIdQuestionId(id, current_game.data.selected_question.id).catch(err => {
      return {
        referenceId: id,
        status: "Failed",
        message: err.message,
        code: 500
      };
    });

    if (current_answer.data.owner_id == user_id) {
      return {
        referenceId: id,
        status: "Failed",
        message: "You cannot vote for your own answer",
        code: 401
      };
    }

    var current_score = yield scoreDataSource.getScoreByGameIdPlayerIdRound(id, current_answer.data.owner_id, current_game.data.round).catch(err => {
      return {
        referenceId,
        status: "Failed",
        message: err.message,
        code: 500
      };
    });
    var current_votes = yield voteDataSource.getVotesByAnswerId(current_answer.data.id).catch(err => {
      return {
        referenceId: id,
        status: "Failed",
        message: err.message,
        code: 500
      };
    });
    var total_approve = 0;

    for (var vote_id in current_votes.data) {
      if (current_votes.data[vote_id].approve) {
        total_approve = total_approve + 1;
      }

      if (user_id != current_votes.data[id].owner_id) {
        return voteDataSource.createVote(current_answer.data.id, id, correct, user_id);
      } else {
        return {
          referenceId: id,
          status: "Failed",
          message: "You cannot vote because you already voted",
          code: 401
        };
      }
    }

    if (current_votes.data.length == 3) {
      //Handle score update
      var ratio = total_approve / (current_votes.length + 1);
      var award = ratio * current_question.data.max_points;
      yield scoreDataSource.updateScore(current_answer.data.score_id, {
        value: current_score.data.value + award
      }).catch(err => {
        return {
          referenceId: id,
          status: "Failed",
          message: err.message,
          status: 500
        };
      });
      yield _server.db.collection(collectionName).update({
        sub_state: "Awaiting Completion By Player"
      });
    }

    return {
      referenceId: id,
      status: "Success",
      message: "Successfully voted",
      code: 200
    };
  });
  return _voteAnswer.apply(this, arguments);
}

function answerQuestion(_x13, _x14, _x15) {
  return _answerQuestion.apply(this, arguments);
}

function _answerQuestion() {
  _answerQuestion = _asyncToGenerator(function* (id, answer, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      throw current_game.error;
    }

    if (current_game.data.sub_state != "Answering Question") {
      throw new Error("You cannot answer a question when a question has not been selected");
    }

    if (current_game.data.player_ids[current_game.data.spins % current_game.data.player_ids.length] != user_id) {
      throw new Error("You cannot answer the question when it is not your turn");
    }

    var next_state = "Voting";
    var player_score = yield scoreDataSource.getScoreByGameIdPlayerIdRound(id, user_id, current_game.data.round).catch(err => {
      throw err;
    });
    yield answerDataSource.createAnswer(current_game.data.selected_question.id, player_score.data.id, id, answer, user_id).catch(err => {
      throw err;
    });
    return _server.db.collection(collectionName).doc(id).update({
      sub_state: next_state
    }).then(() => {
      return {
        data: Object.assign(current_game.data, {
          sub_state: next_state
        })
      };
    }).catch(err => {
      throw err;
    });
  });
  return _answerQuestion.apply(this, arguments);
}

function selectCategory(_x16, _x17, _x18) {
  return _selectCategory.apply(this, arguments);
}

function _selectCategory() {
  _selectCategory = _asyncToGenerator(function* (id, category_choice, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      throw current_game.error;
    }

    if (current_game.data.sub_state != "Player Choice" && current_game.data.sub_state != "Opponent Choice") {
      throw new Error("Cannot select category when not in the Player Choice or Opponent choice state");
    }

    if (current_game.data.player_ids[current_game.data.spins % current_game.data.player_ids.length] != user_id && current_game.data.sub_state == "Player Choice") {
      throw new Error("You cannot select category because it's Player's Choice and not your turn");
    }

    if (current_game.data.player_ids[current_game.data.spins + 1 % current_game.data.player_ids.length] != user_id && current_game.data.sub_state == "Opponent Choice") {
      throw new Error("You cannot select category because it's Opponent Choice and you are not the next player after the current player's spin");
    }

    if (!current_game.data.question_categories.slice(6 * (current_game.data.round - 1), 6 * current_game.data.round)) {
      throw new Error("Question Category is not present in the round or the game itself");
    }

    var answers = yield answerDataSource.getAnswerByGameId(id);
    var used_questions = answers.map(x => x.question_id);
    var selected_question = yield questionDataSource.getRandomQuestionByCategory(random_spin).catch(err => {
      throw err;
    });

    while (used_questions.includes(selected_question.data.id)) {
      selected_question = yield questionDataSource.getRandomQuestionByCategory(random_spin).catch(err => {
        throw err;
      });
    }

    var next_state = "Answering Question";
    return _server.db.collection(collectionName).doc(id).update({
      sub_state: next_state,
      selected_question: selected_question.data.id
    }).then(() => {
      return {
        data: Object.assign(current_game.data, {
          sub_state: next_state,
          selected_question: selected_question.data.id || null
        })
      };
    }).catch(err => {
      throw err;
    });
  });
  return _selectCategory.apply(this, arguments);
}

function spinWheel(_x19, _x20) {
  return _spinWheel.apply(this, arguments);
}

function _spinWheel() {
  _spinWheel = _asyncToGenerator(function* (id, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      throw current_game.error;
    }

    if (current_game.data.player_ids[current_game.data.spins % current_game.data.player_ids.length] != user_id) {
      throw new Error("Cannot spin the wheel when it isn't your turn");
    }

    if (current_game.data.sub_state != "Waiting") {
      throw new Error("The wheel has already been spun for your turn. Your turn must now complete before proceeding to the next player's turn");
    }

    yield _server.db.collection(collectionName).doc(id).update({
      sub_state: "Spinning"
    }).catch(err => {
      throw err;
    });
    var spin_options = current_game.data.question_categories.slice(6 * (current_game.data.round - 1), 6 * current_game.data.round).concat(["opponent_choice"]);
    var random_spin = spin_options[(0, _utils.getRandomInt)(spin_options.length - 1)];
    var player_score = yield scoreDataSource.getScoreByGameIdPlayerIdRound(id, user_id, current_game.data.round).catch(err => {
      throw err;
    });
    var free_spin = yield freeSpinDataSource.getFreeSpinsByGameIdPlayerId(id, user_id);
    var next_state = "Awaiting Completion By Player";

    switch (random_spin) {
      case "double_score":
        yield scoreDataSource.updateScore(player_score.data.id, {
          modifier: player_score.data.modifier * 2
        }).catch(err => {
          throw err;
        });
        break;

      case "bankrupt":
        yield scoreDataSource.updateScore(player_score.data.id, {
          value: 0
        }).catch(err => {
          throw err;
        });
        break;

      case "free_spin":
        yield freeSpinDataSource.updateFreeSpin(free_spin.data.id, free_spin.data.value + 1).catch(err => {
          throw err;
        });
        break;

      case "lose_turn":
        break;

      case "player_choice":
        next_state = "Player Choice";
        break;

      case "opponent_choice":
        next_state = "Opponent Choice";
        break;

      default:
        next_state = "Answering";
        break;
    }

    if (next_state == "Answering") {
      var answers = yield answerDataSource.getAnswerByGameId(id);
      var used_questions = answers.map(x => x.question_id);
      var selected_question = yield questionDataSource.getRandomQuestionByCategory(random_spin).catch(err => {
        throw err;
      });

      while (used_questions.includes(selected_question.data.id)) {
        selected_question = yield questionDataSource.getRandomQuestionByCategory(random_spin).catch(err => {
          throw err;
        });
      }

      if (selected_question.data == null) {
        return spinWheel(id, user_id);
      }

      return _server.db.collection(collectionName).doc(id).update({
        sub_state: next_state,
        selected_question: selected_question.data.id || null
      }).then(() => {
        return {
          data: Object.assign(current_game.data, {
            sub_state: next_state,
            selected_question: selected_question.data.id || null,
            current_spin: random_spin
          })
        };
      }).catch(err => {
        throw err;
      });
    }

    return _server.db.collection(collectionName).doc(id).update({
      sub_state: next_state,
      current_spin: random_spin
    }).then(() => {
      return {
        data: Object.assign(current_game.data, {
          sub_state: next_state,
          current_spin: random_spin
        })
      };
    }).catch(err => {
      throw err;
    });
  });
  return _spinWheel.apply(this, arguments);
}

function startGame(_x21, _x22) {
  return _startGame.apply(this, arguments);
}

function _startGame() {
  _startGame = _asyncToGenerator(function* (id, user_id) {
    var current_game = yield getGameById(id);

    if (current_game.error) {
      throw current_game.error;
    }

    if (current_game.data.owner_id != user_id) {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot start a game that you do not own",
        code: 401
      };
      return resultObj;
    }

    if (current_game.data.state != "Created") {
      resultObj = {
        referenceId: id,
        status: "Failed",
        message: "Cannot start a game that is not in the created state",
        code: 401
      };
      return resultObj;
    }

    return _server.db.collection(collectionName).doc(id).update({
      state: "Started",
      round: 1
    }).then(() => {
      resultObj = {
        referenceId: id,
        status: "Success",
        message: "Successfully started the game",
        code: 200
      };
      return resultObj;
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
  });
  return _startGame.apply(this, arguments);
}

function createGame(name, question_categories, owner_id) {
  return _server.db.collection(collectionName).add({
    spins: 0,
    current_spin: null,
    name: name,
    question_categories: question_categories,
    selected_question: null,
    player_ids: [owner_id],
    round: 0,
    state: "Created",
    sub_state: "Waiting",
    owner_id: owner_id,
    answer_timeout: 30,
    updatedAt: (0, _utils.getCurrentUnix)(),
    createdAt: (0, _utils.getCurrentUnix)()
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

        return function (_x24) {
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

        return function (_x25) {
          return _ref3.apply(this, arguments);
        };
      }());
    });

    return function (_x23) {
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