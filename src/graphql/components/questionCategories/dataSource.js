import { db } from "../../server";
import * as profileDataSource from "../profiles/dataSource";
import { transformFirestoreToJson, getCurrentUnix } from "../../utils";
import moment from "moment";
import admin from "firebase-admin";

let question_categories = [];
let parsedData;
let resultObj = {};
const collectionName = "question_categories";

export function getQuestionCategoryById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A question category with the id does not exist!")
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

export async function getQuestionCategoriesPaginated(limit, after, user_id) {
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
    var countRef = null;
    var queryRef = null;
    if (user != null) {
      queryRef = db
        .collection(collectionName)
        .where("owner", "==", id)
        .orderBy("updatedAt", "desc")
        .limit(limit);
      countRef = db.collection(collectionName).where("owner", "==", id);
    } else {
      queryRef = db
        .collection(collectionName)
        .orderBy("updatedAt", "desc")
        .limit(limit);
      countRef = db.collection(collectionName);
    }
    return db.runTransaction(transaction => {
      var questionCategoryRef = transaction.get(queryRef);
      return questionCategoryRef.then(snapshot => {
        question_categories = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
            question_categories.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: question_categories,
            cursor:
              question_categories.length > 0
                ? question_categories[question_categories.length - 1].id
                : null,
            count: countSnapshot.size,
            error: null
          };
          return resultObj;
        });
      });
    });
  } else {
    var countRef = null;
    var queryRef = null;
    if (user != null) {
      queryRef = db
        .collection(collectionName)
        .where("owner", "==", id)
        .orderBy("updatedAt", "desc")
        .startAt(doc)
        .offset(1)
        .limit(limit);
      countRef = db.collection(collectionName).where("owner", "==", id);
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
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          question_categories = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
              question_categories.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: question_categories,
              cursor:
                question_categories.length > 0
                  ? question_categories[question_categories.length - 1].id
                  : null,
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
            "An error occured while attempting to get question categories"
          )
        };
        return resultObj;
      });
  }
}

export async function createQuestionCategory(name, user_id) {
  return db
    .collection(collectionName)
    .add({
      name: name,
      createdAt: getCurrentUnix(),
      updatedAt: getCurrentUnix(),
      owner_id: user_id
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
          "An error occured while attempting to create the question category"
        )
      };
      return resultObj;
    });
}

export function updateQuestionCategory(id, name, userId) {
  var docRef = db.collection(collectionName).doc(id);
  return db
    .runTransaction(transaction => {
      var questionCategoryDoc = transaction.get(docRef);
      return questionCategoryDoc.then(doc => {
        if (userId != transformFirestoreToJson(doc).owner_id) {
          throw new Error("Unauthorized");
        }
        if (doc.exists) {
          var parsedData = transformFirestoreToJson(doc);
          transaction.update(docRef, {
            name: name,
            updatedAt: getCurrentUnix()
          });
        } else {
          throw new Error("Document does not exist");
        }
      });
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully updated question category",
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
            "The user requesting update is not the owner of the question category and therefore unauthorized",
          code: 401
        };
      } else if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "An question category with that id does not exist",
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

export function deleteQuestionCategory(id, userId) {
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
        return doc.ref.delete().then(() => {
          return db
            .collection("questions")
            .where("question_category_id", "==", id)
            .get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                doc.ref.delete();
              });
            });
        });
      }
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully deleted question category",
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
            "The user requesting deletion is not the owner of the queston category and therefore unauthorized",
          code: 401
        };
      } else if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A question category with that id does not exist",
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
