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
const collectionName = "scores";

export function getScoreById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A score with the id does not exist!")
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

export function getScoreByReferences(reference_ids) {
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

export function getScoresPaginated(limit, after) {
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
          error: new Error("An error occured while attempting to get scores")
        };
        return resultObj;
      });
  }
}

export function createScore(type, round, game_id, owner_id) {
  return db
    .collection(collectionName)
    .add({
      type: type,
      value: 0.0,
      modifier: 1.0,
      round: round,
      game_id: game_id,
      owner_id: owner_id,
      createdAt: getCurrentUnix(),
      updatedAt: getCurrentUnix()
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
          "An error occured while attempting to create the score"
        )
      };
      return resultObj;
    });
}

export function updateScore(id, args) {
  var updateInfo = {};
  for (var property in args) {
    if (args.hasOwnProperty(property)) {
      updateInfo[property] = args[property];
    }
  }
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (doc.exists) {
        doc.ref.update(
          Object.assign(updateInfo, { updatedAt: getCurrentUnix() })
        );
        return {
          referenceId: id,
          status: "Success",
          message: "Successfully updated score",
          code: 200
        };
      } else {
        throw new Error("Document does not exist");
      }
    })
    .catch(error => {
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
