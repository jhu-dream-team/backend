import { db } from "../../server";
import * as voteDataSource from "../votes/dataSource";
import * as scoreDataSource from "../scores/dataSource";
import * as freeSpinDataSource from "../freeSpins/dataSource";
import * as questionDataSource from "../questions/dataSource";
import * as answerDataSource from "../answers/dataSource";
import * as profileDataSource from "../profiles/dataSource";
import {
  transformFirestoreToJson,
  getCurrentUnix,
  getRandomInt
} from "../../utils";
import moment from "moment";
import admin from "firebase-admin";

let games = [];
let parsedData;
let resultObj = {};
const collectionName = "games";

export function getGameById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A game with the id does not exist!")
        };
        return resultObj;
      }
      var parsedData = transformFirestoreToJson(doc);
      resultObj = {
        data: parsedData,
        error: null
      };
      return resultObj;
    });
}

export async function getGamesPaginated(limit, after, user_id) {
  let user;
  if (user_id != null) {
    try {
      user = await profileDataSource.getUserById(user_id);
      if (user.error) {
        throw error;
      }
    } catch (e) {
      return {
        data: null,
        cursor: null,
        error: new Error(
          "Error resolving the user object of the requesting user"
        )
      };
    }
  }
  if (after == undefined || after == null) {
    var queryRef = null;
    var countRef = null;
    if (user != null) {
      queryRef = db
        .collection(collectionName)
        .where("player_ids", "array-contains", user_id)
        .orderBy("updatedAt", "desc")
        .limit(limit);
      countRef = db.collection(collectionName).where("player_ids", "array-contains", user_id);
    } else {
      countRef = db.collection(collectionName);
      queryRef = db
        .collection(collectionName)
        .orderBy("updatedAt", "desc")
        .limit(limit);
    }
    return db.runTransaction(transaction => {
      var gameRef = transaction.get(queryRef);
      return gameRef.then(snapshot => {
        games = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
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
      queryRef = db
        .collection(collectionName)
        .where("player_ids", "array-contains", user_id)
        .orderBy("updatedAt", "desc")
        .startAt(doc)
        .offset(1)
        .limit(limit);
      countRef = db.collection(collectionName).where("player_ids", "array-contains", user_id);
    } else {
      queryRef = db
        .collection(collectionName)
        .orderBy("updatedAt", "desc")
        .startAt(doc)
        .offset(1)
        .limit(limit);
      countRef = db.collection(collectionName);
    }
    return db
      .runTransaction(transaction => {
        var gameRef = transaction.get(queryRef);
        return gameRef.then(snapshot => {
          games = [];
          snapshot.forEach(doc => {
            console.dir(doc)
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
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
      })
      .catch(error => {
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

export async function joinGame(id, user_id) {
  var current_game = await getGameById(id);
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
  return db
    .collection(collectionName)
    .doc(current_game.data.id)
    .update({
      player_ids: current_game.data.player_ids.concat([user_id])
    })
    .then(async () => {
      ["game", 1, 2].forEach(async el => {
        if (el == "game") {
          await scoreDataSource.createScore(
            "game",
            0,
            current_game.data.id,
            user_id
          );
        } else {
          await scoreDataSource.createScore(
            "round",
            el,
            current_game.data.id,
            user_id
          );
        }
      });
      await freeSpinDataSource.createFreeSpin(current_game.data.id, user_id);
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully joined game",
        code: 200
      };
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message:
            "The user requesting deletion is not the owner of the game and therefore unauthorized",
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

export async function leaveGame(id, user_id) {
  var current_game = await getGameById(id);
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
  return db
    .collection(collectionName)
    .doc(current_game.data.id)
    .update({
      player_ids: removed_player
    })
    .then(async () => {
      await db
        .collection("scores")
        .where("game_id", "==", current_game.data.id)
        .where("owner_id", "==", user_id)
        .get()
        .then(snapshot => {
          snapshot.forEach(scoreDoc => {
            scoreDoc.ref.delete();
          });
        });
      await db
        .collection("answers")
        .where("game_id", "==", current_game.data.id)
        .where("owner_id", "==", user_id)
        .get()
        .then(snapshot => {
          snapshot.forEach(answerDoc => {
            answerDoc.ref.delete();
          });
        });
      await db
        .collection("votes")
        .where("game_id", "==", current_game.data.id)
        .where("owner_id", "==", user_id)
        .get()
        .then(snapshot => {
          snapshot.forEach(voteDoc => {
            voteDoc.ref.delete();
          });
        });
      await db
        .collection("free_spins")
        .where("game_id", "==", current_game.data.id)
        .where("owner_id", "==", user_id)
        .get()
        .then(snapshot => {
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
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message:
            "The user requesting deletion is not the owner of the game and therefore unauthorized",
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

export async function completeTurn(id, user_id) {
  var current_game = await getGameById(id);
  if (current_game.error) {
    throw current_game.error;
  }
  if (current_game.data.sub_state != "Awaiting Completion By Player") {
    throw new Error("Wrong state");
  }
  if (
    current_game.data.player_ids[
      current_game.data.spins % current_game.data.player_ids.length
    ] != user_id
  ) {
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
  return db
    .collection(collectionName)
    .doc(id)
    .update({
      sub_state: "Waiting",
      spins: current_game.data.spins + 1,
      selected_question: null,
      current_spin: null,
      round: round,
      state: state
    });
}

export async function voteAnswer(id, correct, user_id) {
  var current_game = await getGameById(id);
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
  var current_question = await questionDataSource
    .getQuestionById(current_game.data.current_question.id)
    .catch(err => {
      return {
        referenceId: id,
        status: "Failed",
        message: err.message,
        code: 500
      };
    });
  var current_answer = await answerDataSource
    .getAnswerByGameIdQuestionId(id, current_game.data.selected_question.id)
    .catch(err => {
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
  var current_score = await scoreDataSource
    .getScoreByGameIdPlayerIdRound(
      id,
      current_answer.data.owner_id,
      current_game.data.round
    )
    .catch(err => {
      return {
        referenceId,
        status: "Failed",
        message: err.message,
        code: 500
      };
    });
  var current_votes = await voteDataSource
    .getVotesByAnswerId(current_answer.data.id)
    .catch(err => {
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
      return voteDataSource.createVote(
        current_answer.data.id,
        id,
        correct,
        user_id
      );
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
    await scoreDataSource
      .updateScore(current_answer.data.score_id, {
        value: current_score.data.value + award
      })
      .catch(err => {
        return {
          referenceId: id,
          status: "Failed",
          message: err.message,
          status: 500
        };
      });
    await db.collection(collectionName).update({
      sub_state: "Awaiting Completion By Player"
    });
  }
  return {
    referenceId: id,
    status: "Success",
    message: "Successfully voted",
    code: 200
  };
}

export async function answerQuestion(id, answer, user_id) {
  var current_game = await getGameById(id);
  if (current_game.error) {
    throw current_game.error;
  }
  if (current_game.data.sub_state != "Answering Question") {
    throw new Error(
      "You cannot answer a question when a question has not been selected"
    );
  }
  if (
    current_game.data.player_ids[
      current_game.data.spins % current_game.data.player_ids.length
    ] != user_id
  ) {
    throw new Error("You cannot answer the question when it is not your turn");
  }
  var next_state = "Voting";
  var player_score = await scoreDataSource
    .getScoreByGameIdPlayerIdRound(id, user_id, current_game.data.round)
    .catch(err => {
      throw err;
    });
  await answerDataSource
    .createAnswer(
      current_game.data.selected_question.id,
      player_score.data.id,
      id,
      answer,
      user_id
    )
    .catch(err => {
      throw err;
    });
  return db
    .collection(collectionName)
    .doc(id)
    .update({
      sub_state: next_state
    })
    .then(() => {
      return {
        data: Object.assign(current_game.data, {
          sub_state: next_state
        })
      };
    })
    .catch(err => {
      throw err;
    });
}

export async function selectCategory(id, category_choice, user_id) {
  var current_game = await getGameById(id);
  if (current_game.error) {
    throw current_game.error;
  }
  if (
    current_game.data.sub_state != "Player Choice" &&
    current_game.data.sub_state != "Opponent Choice"
  ) {
    throw new Error(
      "Cannot select category when not in the Player Choice or Opponent choice state"
    );
  }
  if (
    current_game.data.player_ids[
      current_game.data.spins % current_game.data.player_ids.length
    ] != user_id &&
    current_game.data.sub_state == "Player Choice"
  ) {
    throw new Error(
      "You cannot select category because it's Player's Choice and not your turn"
    );
  }
  if (
    current_game.data.player_ids[
      current_game.data.spins + (1 % current_game.data.player_ids.length)
    ] != user_id &&
    current_game.data.sub_state == "Opponent Choice"
  ) {
    throw new Error(
      "You cannot select category because it's Opponent Choice and you are not the next player after the current player's spin"
    );
  }
  if (
    !current_game.data.question_categories.slice(
      6 * (current_game.data.round - 1),
      6 * current_game.data.round
    )
  ) {
    throw new Error(
      "Question Category is not present in the round or the game itself"
    );
  }
  var answers = await answerDataSource.getAnswerByGameId(id);
  var used_questions = answers.map(x => x.question_id);
  var selected_question = await questionDataSource
    .getRandomQuestionByCategory(random_spin)
    .catch(err => {
      throw err;
    });
  while (used_questions.includes(selected_question.data.id)) {
    selected_question = await questionDataSource
      .getRandomQuestionByCategory(random_spin)
      .catch(err => {
        throw err;
      });
  }
  var next_state = "Answering Question";
  return db
    .collection(collectionName)
    .doc(id)
    .update({
      sub_state: next_state,
      selected_question: selected_question.data.id
    })
    .then(() => {
      return {
        data: Object.assign(current_game.data, {
          sub_state: next_state,
          selected_question: selected_question.data.id || null
        })
      };
    })
    .catch(err => {
      throw err;
    });
}

export async function spinWheel(id, user_id) {
  var current_game = await getGameById(id);
  if (current_game.error) {
    throw current_game.error;
  }
  if (
    current_game.data.player_ids[
      current_game.data.spins % current_game.data.player_ids.length
    ] != user_id
  ) {
    throw new Error("Cannot spin the wheel when it isn't your turn");
  }
  if (current_game.data.sub_state != "Waiting") {
    throw new Error(
      "The wheel has already been spun for your turn. Your turn must now complete before proceeding to the next player's turn"
    );
  }
  await db
    .collection(collectionName)
    .doc(id)
    .update({ sub_state: "Spinning" })
    .catch(err => {
      throw err;
    });
  var spin_options = current_game.data.question_categories
    .slice(6 * (current_game.data.round - 1), 6 * current_game.data.round)
    .concat(["opponent_choice"]);
  var random_spin = spin_options[getRandomInt(spin_options.length - 1)];
  var player_score = await scoreDataSource
    .getScoreByGameIdPlayerIdRound(id, user_id, current_game.data.round)
    .catch(err => {
      throw err;
    });
  var free_spin = await freeSpinDataSource.getFreeSpinsByGameIdPlayerId(
    id,
    user_id
  );
  var next_state = "Awaiting Completion By Player";
  switch (random_spin) {
    case "double_score":
      await scoreDataSource
        .updateScore(player_score.data.id, {
          modifier: player_score.data.modifier * 2
        })
        .catch(err => {
          throw err;
        });
      break;
    case "bankrupt":
      await scoreDataSource
        .updateScore(player_score.data.id, { value: 0 })
        .catch(err => {
          throw err;
        });
      break;
    case "free_spin":
      await freeSpinDataSource
        .updateFreeSpin(free_spin.data.id, free_spin.data.value + 1)
        .catch(err => {
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
    var answers = await answerDataSource.getAnswerByGameId(id);
    var used_questions = answers.map(x => x.question_id);
    var selected_question = await questionDataSource
      .getRandomQuestionByCategory(random_spin)
      .catch(err => {
        throw err;
      });
    while (used_questions.includes(selected_question.data.id)) {
      selected_question = await questionDataSource
        .getRandomQuestionByCategory(random_spin)
        .catch(err => {
          throw err;
        });
    }
    if (selected_question.data == null) {
      return spinWheel(id, user_id);
    }
    return db
      .collection(collectionName)
      .doc(id)
      .update({
        sub_state: next_state,
        selected_question: selected_question.data.id || null
      })
      .then(() => {
        return {
          data: Object.assign(current_game.data, {
            sub_state: next_state,
            selected_question: selected_question.data.id || null,
            current_spin: random_spin
          })
        };
      })
      .catch(err => {
        throw err;
      });
  }
  return db
    .collection(collectionName)
    .doc(id)
    .update({
      sub_state: next_state,
      current_spin: random_spin
    })
    .then(() => {
      return {
        data: Object.assign(current_game.data, {
          sub_state: next_state,
          current_spin: random_spin
        })
      };
    })
    .catch(err => {
      throw err;
    });
}

export async function startGame(id, user_id) {
  var current_game = await getGameById(id);
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
  return db
    .collection(collectionName)
    .doc(id)
    .update({
      state: "Started",
      round: 1
    })
    .then(() => {
      resultObj = {
        referenceId: id,
        status: "Success",
        message: "Successfully started the game",
        code: 200
      };
      return resultObj;
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message:
            "The user requesting deletion is not the owner of the game and therefore unauthorized",
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

export function createGame(name, question_categories, owner_id) {
  return db
    .collection(collectionName)
    .add({
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
      updatedAt: getCurrentUnix(),
      createdAt: getCurrentUnix()
    })
    .then(async docRef => {
      ["game", 1, 2].forEach(async el => {
        if (el == "game") {
          await scoreDataSource.createScore("game", 0, docRef.id, owner_id);
        } else {
          await scoreDataSource.createScore("round", el, docRef.id, owner_id);
        }
      });
      await freeSpinDataSource.createFreeSpin(docRef.id, owner_id);
      return db
        .collection(collectionName)
        .doc(docRef.id)
        .get()
        .then(async doc => {
          parsedData = transformFirestoreToJson(doc);
          resultObj = {
            data: parsedData,
            error: null
          };
          return resultObj;
        });
    })
    .catch(err => {
      console.log(err);
      resultObj = {
        data: null,
        error: new Error(
          "An error occured while attempting to create the score"
        )
      };
      return resultObj;
    });
}

export function deleteGame(id, userId) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        throw new Error("Document does not exist");
      }
      if (userId != transformFirestoreToJson(doc).owner_id) {
        throw new Error("Unauthorized");
      }
      if (doc.exists) {
        var parsedData = transformFirestoreToJson(doc);
        return doc.ref.delete().then(() => {
          db.collection("scores")
            .where("game_id", "==", parsedData.id)
            .get()
            .then(snapshot => {
              snapshot.forEach(scoreDoc => {
                scoreDoc.ref.delete();
              });
            });
          db.collection("answers")
            .where("game_id", "==", parsedData.id)
            .get()
            .then(snapshot => {
              snapshot.forEach(answerDoc => {
                answerDoc.ref.delete();
              });
            });
          db.collection("votes")
            .where("game_id", "==", parsedData.id)
            .get()
            .then(snapshot => {
              snapshot.forEach(voteDoc => {
                voteDoc.ref.delete();
              });
            });
          return db
            .collection("free_spins")
            .where("game_id", "==", parsedData.id)
            .get()
            .then(snapshot => {
              snapshot.forEach(freeSpinDoc => {
                freeSpinDoc.ref.delete();
              });
            });
        });
      }
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully deleted game",
        code: 200
      };
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message:
            "The user requesting deletion is not the owner of the game and therefore unauthorized",
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
