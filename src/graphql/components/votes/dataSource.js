import { db } from "../../server";
import * as profileDataSource from "../profiles/dataSource";
import {
  transformFirestoreToJson,
  getCurrentUnix,
  getRandomInt
} from "../../utils";
import moment from "moment";
import admin from "firebase-admin";

let votes = [];
let parsedData;
let resultObj = {};
const collectionName = "votes";

export async function getVoteByAnswerId(answer_id) {
  return db
    .collection(collectionName)
    .where("answer_id", "==", answer_id)
    .get()
    .then(snapshot => {
      if (snapshot.docs.length == 0) {
        return {
          data: [],
          error: null
        };
      }
      votes = [];
      snapshot.forEach(doc => {
        votes.push(transformFirestoreToJson(doc));
      });
      return {
        data: votes,
        error: null
      };
    })
    .catch(err => {
      return {
        data: null,
        error: err
      };
    });
}

export function getVoteById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A vote with the id does not exist!")
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

export function getVotesByAnswer(answer_id) {
  var votes = [];
  return db
    .collection(collectionName)
    .where("answer_id", "==", answer_id)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        if (doc.exists) {
          var parsedData = transformFirestoreToJson(doc);
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

export function createVote(answer_id, game_id, approve, user_id) {
  return db
    .collection(collectionName)
    .add({
      answer_id: answer_id,
      game_id: game_id,
      approve: approve,
      owner_id: user_id
    })
    .then(async docRef => {
      return db
        .collection(collectionName)
        .doc(docRef.id)
        .get()
        .then(doc => {
          return {
            data: transformFirestoreToJson(doc),
            error: null
          };
        })
        .catch(err => {
          return {
            data: null,
            error: err
          };
        });
    });
}

export function getVotesPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        votes = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
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
          votes = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
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
      })
      .catch(error => {
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
