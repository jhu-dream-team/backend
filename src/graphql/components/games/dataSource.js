import { db } from "../../server";
import * as scoreDataSource from "../scores/dataSource";
import * as freeSpinDataSource from "../freeSpins/dataSource";
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

export function getGamesPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
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
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .startAt(doc)
      .offset(1)
      .limit(limit);

    return db
      .runTransaction(transaction => {
        var scoreRef = transaction.get(queryRef);
        return scoreRef.then(snapshot => {
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
  }
  if (current_game.data.player_ids.includes(user_id)) {
    resultObj = {
      referenceId: id,
      status: "Failed",
      message: "Cannot join game that your are already a part of",
      code: 401
    };
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

export function createGame(name, question_categories, owner_id) {
  return db
    .collection(collectionName)
    .add({
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
