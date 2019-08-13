import { db } from "../../server";
import * as profileDataSource from "../profiles/dataSource";
import {
  transformFirestoreToJson,
  getCurrentUnix,
  getRandomInt
} from "../../utils";
import moment from "moment";
import admin from "firebase-admin";

let scores = [];
let parsedData;
let resultObj = {};
const collectionName = "free_spins";

export function getFreeSpinsById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A free spin entry with the id does not exist!")
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

export function getFreeSpinsByGameIdPlayerId(game_id, player_id) {
  return db
    .collection(collectionName)
    .where("game_id", "==", game_id)
    .where("owner_id", "==", player_id)
    .get()
    .then(snapshot => {
      if (snapshot.size < 0) {
        throw Error("No free spin object found");
      }
      return {
        data: transformFirestoreToJson(snapshot.docs[0]),
        error: null
      };
    })
    .catch(err => {
      console.log(err);
      return {
        data: null,
        error: err
      };
    });
}

export function getFreeSpinsPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var scoreRef = transaction.get(queryRef);
      return scoreRef.then(snapshot => {
        scores = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
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
          scores = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
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
      })
      .catch(error => {
        console.log(error);
        resultObj = {
          data: null,
          cursor: null,
          error: new Error(
            "An error occured while attempting to get free spins"
          )
        };
        return resultObj;
      });
  }
}

export function updateFreeSpin(id, value) {
  return db
    .collection(collectionName)
    .doc(id)
    .update({
      value: value
    })
    .then(() => {
      return;
    })
    .catch(err => {
      throw err;
    });
}

export function createFreeSpin(game_id, owner_id) {
  return db
    .collection(collectionName)
    .add({
      game_id: game_id,
      owner_id: owner_id,
      value: 0
    })
    .then(async docRef => {
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
          "An error occured while attempting to create the free spin entry"
        )
      };
      return resultObj;
    });
}
