import { db } from "../../server";
import * as profileDataSource from "../profiles/dataSource";
import {
  transformFirestoreToJson,
  getCurrentUnix,
  getRandomInt
} from "../../utils";
import moment from "moment";
import admin from "firebase-admin";

let answer = [];
let parsedData;
let resultObj = {};
const collectionName = "answers";

export function getAnswerByGameId(game_id) {
  return db
    .collection(collectionName)
    .where("game_id", "==", game_id)
    .get()
    .then(snapshot => {
      if (snapshot.size < 1) {
        return [];
      }
      var answers = [];
      snapshot.forEach(doc => {
        answers.push(transformFirestoreToJson(doc));
      });
      return answers;
    })
    .catch(err => {
      throw err;
    });
}

export function getAnswerById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("An answer with the id does not exist!")
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

export function getAnswersPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
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
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .startAt(doc)
      .offset(1)
      .limit(limit);

    return db
      .runTransaction(transaction => {
        var answerRef = transaction.get(queryRef);
        return answerRef.then(snapshot => {
          answers = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
              answers.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: answers,
              cursor:
                answers.length > 0 ? answers[answers.length - 1].id : null,
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
          error: new Error("An error occured while attempting to get answers")
        };
        return resultObj;
      });
  }
}

export function getAnswerByScoreId(score_id, limit, after) {
  if (after == undefined || after == null) {
    var countRef = db
      .collection(collectionName)
      .where("score_id", "==", score_id);
    var queryRef = db
      .collection(collectionName)
      .where("score_id", "==", score_id)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var answerRef = transaction.get(queryRef);
      return answerRef.then(snapshot => {
        answers = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
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
    var countRef = db
      .collection(collectionName)
      .where("score_id", "==", score_id);
    var queryRef = db
      .collection(collectionName)
      .where("score_id", "==", score_id)
      .orderBy("updatedAt", "desc")
      .startAt(doc)
      .offset(1)
      .limit(limit);

    return db
      .runTransaction(transaction => {
        var answerRef = transaction.get(queryRef);
        return answerRef.then(snapshot => {
          answers = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
              answers.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: answers,
              cursor:
                answers.length > 0 ? answers[answers.length - 1].id : null,
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
          error: new Error("An error occured while attempting to get answers")
        };
        return resultObj;
      });
  }
}
