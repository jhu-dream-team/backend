import { db } from "../../server";
import * as profileDataSource from "../profiles/dataSource";
import {
  transformFirestoreToJson,
  getCurrentUnix,
  getRandomInt
} from "../../utils";
import moment from "moment";
import admin from "firebase-admin";

let questions = [];
let parsedData;
let resultObj = {};
const collectionName = "questions";

export function getQuestionById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A question with the id does not exist!")
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

export function getRandomQuestionByCategory(question_category_id) {
  console.log(question_category_id);
  return db
    .collection(collectionName)
    .where("question_category_id", "==", question_category_id)
    .get()
    .then(snapshot => {
      questions = [];
      snapshot.forEach(doc => {
        console.log(doc);
        if (doc.exists) {
          var parsedData = transformFirestoreToJson(doc);
          questions.push(parsedData);
        }
      });
      console.log(questions);
      var random_question_number = getRandomInt(questions.length - 1);
      console.log(random_question_number);
      resultObj = {
        data: questions[random_question_number],
        error: null
      };
      return resultObj;
    });
}

export function getQuestionsPaginated(limit, after) {
  if (after == undefined || after == null) {
    var countRef = db.collection(collectionName);
    var queryRef = db
      .collection(collectionName)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var questionRef = transaction.get(queryRef);
      return questionRef.then(snapshot => {
        questions = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
            questions.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: questions,
            cursor:
              questions.length > 0 ? questions[questions.length - 1].id : null,
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
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          questions = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
              questions.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: questions,
              cursor:
                questions.length > 0
                  ? questions[questions.length - 1].id
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
          error: new Error("An error occured while attempting to get questions")
        };
        return resultObj;
      });
  }
}

export function getQuestionsByCategoryPaginated(
  question_category_id,
  limit,
  after
) {
  if (after == undefined || after == null) {
    var countRef = db
      .collection(collectionName)
      .where("question_category_id", "==", question_category_id);
    var queryRef = db
      .collection(collectionName)
      .where("question_category_id", "==", question_category_id)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    return db.runTransaction(transaction => {
      var questionRef = transaction.get(queryRef);
      return questionRef.then(snapshot => {
        questions = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
            questions.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: questions,
            cursor:
              questions.length > 0 ? questions[questions.length - 1].id : null,
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
      .where("question_category_id", "==", question_category_id);
    var queryRef = db
      .collection(collectionName)
      .where("question_category_id", "==", question_category_id)
      .orderBy("updatedAt", "desc")
      .startAt(doc)
      .offset(1)
      .limit(limit);

    return db
      .runTransaction(transaction => {
        var questionCategoryRef = transaction.get(queryRef);
        return questionCategoryRef.then(snapshot => {
          questions = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
              questions.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: questions,
              cursor:
                questions.length > 0
                  ? questions[questions.length - 1].id
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
          error: new Error("An error occured while attempting to get questions")
        };
        return resultObj;
      });
  }
}

export async function createQuestion(
  question,
  suggested_answer,
  max_points,
  question_category_id,
  user_id
) {
  return db
    .collection(collectionName)
    .add({
      question: question,
      suggested_answer: suggested_answer,
      max_points: max_points,
      question_category_id: question_category_id,
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
          "An error occured while attempting to create the question"
        )
      };
      return resultObj;
    });
}

export function updateQuestion(id, args, userId) {
  var updateInfo = {};
  for (var property in args) {
    if (args.hasOwnProperty(property)) {
      updateInfo[property] = args[property];
    }
  }
  var docRef = db.collection(collectionName).doc(id);
  return db
    .runTransaction(transaction => {
      var questionDoc = transaction.get(docRef);
      return questionDoc.then(doc => {
        if (userId != transformFirestoreToJson(doc).owner_id) {
          throw new Error("Unauthorized");
        }
        if (doc.exists) {
          var parsedData = transformFirestoreToJson(doc);
          transaction.update(docRef, {
            ...updateInfo,
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
        message: "Successfully updated question",
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
            "The user requesting update is not the owner of the question and therefore unauthorized",
          code: 401
        };
      } else if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A question with that id does not exist",
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

export function deleteQuestion(id, userId) {
  var docRef = db.collection(collectionName).doc(id);
  return db
    .runTransaction(transaction => {
      var questionDoc = transaction.get(docRef);
      return questionDoc.then(doc => {
        if (userId != transformFirestoreToJson(doc).owner_id) {
          throw new Error("Unauthorized");
        }
        if (doc.exists) {
          transaction.delete(docRef);
        } else {
          throw new Error("Document does not exist");
        }
      });
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully deleted question",
        code: 200
      };
    })
    .catch(error => {
      if (error.message == "Unauthorized") {
        return {
          referenceId: id,
          status: "Failure",
          message:
            "The user requesting deletion is not the owner of the question and therefore unauthorized",
          code: 401
        };
      } else if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A question with that id does not exist",
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
