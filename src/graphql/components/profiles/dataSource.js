import { db } from "../../server";
import { transformFirestoreToJson, getCurrentUnix } from "../../utils";
import functions from "firebase-functions";
import admin from "firebase-admin";

const { make } = (require = require("no-avatar"));

let profiles = [];
let resultObj = {};
let resultDoc;
let replaceId;
const collectionName = "users";

export function getUserById(id) {
  return db
    .collection(collectionName)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        resultObj = {
          data: null,
          error: new Error("Profile does not exist")
        };
      }
      var parsedData = transformFirestoreToJson(doc);
      parsedData.createdAt = parsedData.createdAt;
      parsedData.updatedAt = parsedData.updatedAt;
      parsedData.lastActivity = parsedData.lastActivity;
      resultObj = {
        data: parsedData,
        error: null
      };
      return resultObj;
    });
}

export async function checkExistingEmail(email) {
  var emailExistsSet;
  return db.runTransaction(transaction => {
    if (email != null) {
      return transaction
        .get(db.collection(collectionName).where("email", "==", email))
        .then(snapshot => {
          if (snapshot.size > 0) {
            return admin
              .auth()
              .getUserByEmail(snapshot.docs[0].data().email)
              .then(user => {
                return user;
              })
              .catch(err => {
                return null;
              });
          } else {
            return null;
          }
        });
    } else {
      return null;
    }
  });
}

export async function createProfile(
  user_id,
  firstName,
  lastName,
  email,
  deviceToken
) {
  var userRecord;
  try {
    userRecord = await this.checkExistingEmail(email);
  } catch (error) {
    userRecord = null;
  }
  if (userRecord != null) {
    resultObj = {
      data: null,
      error: new Error("A user with that phone or email already exists")
    };
    return resultObj;
  }
  return db
    .collection(collectionName)
    .doc(user_id)
    .get()
    .then(async doc => {
      if (doc.exists) {
        resultObj = {
          data: null,
          error: new Error("A profile with that id already exists")
        };
        return resultObj;
      }
      await db
        .collection(collectionName)
        .doc(user_id)
        .set({
          createdAt: getCurrentUnix(),
          updatedAt: getCurrentUnix(),
          lastActivity: getCurrentUnix(),
          status: "Active",
          firstName: firstName,
          lastName: lastName,
          email: email,
          deviceToken: deviceToken || null
        });
      return db
        .collection(collectionName)
        .doc(user_id)
        .get()
        .then(doc => {
          resultObj = {
            data: transformFirestoreToJson(doc),
            error: null
          };
          return resultObj;
        });
    })
    .catch(err => {
      console.log("[ERROR] Creating User Account: ", err);
      resultObj = {
        data: null,
        error: new Error("An error occured while creating Profile")
      };
      return resultObj;
    });
}

export function getUsersByIds(ids, limit, after) {
  if (after == undefined || after == null) {
    var countRef = db.collection(collectionName);
    var queryRef = db.collection(collectionName).limit(limit);
    return db.runTransaction(transaction => {
      var profileRef = transaction.get(queryRef);
      return profileRef.then(snapshot => {
        profiles = [];
        snapshot.forEach(doc => {
          if (doc.exists) {
            var parsedData = transformFirestoreToJson(doc);
            profiles.push(parsedData);
          }
        });
        return transaction.get(countRef).then(countSnapshot => {
          resultObj = {
            data: profiles,
            cursor:
              profiles.length > 0 ? profiles[profiles.length - 1].id : null,
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
      .startAt(doc)
      .offset(1)
      .limit(limit);

    return db
      .runTransaction(transaction => {
        var profileRef = transaction.get(queryRef);
        return profileRef.then(snapshot => {
          profiles = [];
          snapshot.forEach(doc => {
            if (doc.exists) {
              var parsedData = transformFirestoreToJson(doc);
              profiles.push(parsedData);
            }
          });
          return transaction.get(countRef).then(countSnapshot => {
            resultObj = {
              data: profiles,
              cursor:
                profiles.length > 0 ? profiles[profiles.length - 1].id : null,
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
          error: new Error("An error occured while attempting to get profiles")
        };
        return resultObj;
      });
  }
}

export function updateProfile(id, ip, args) {
  var updateInfo = {};
  for (var property in args) {
    if (args.hasOwnProperty(property)) {
      updateInfo[property] = args[property];
    }
  }
  var docRef = db.collection(collectionName).doc(id);
  return db
    .runTransaction(transaction => {
      return transaction.get(docRef).then(doc => {
        if (doc.exists) {
          transaction.update(
            docRef,
            Object.assign(updateInfo, { updatedAt: getCurrentUnix() })
          );
          resultDoc = Object.assign(
            {},
            transformFirestoreToJson(doc),
            updateInfo
          );
        } else {
          throw new Error("Document does not exist");
        }
      });
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully updated user profile",
        code: 200
      };
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A user profile with that id does not exist",
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

export function updateDeviceToken(id, deviceToken) {
  var docRef = db.collection(collectionName).doc(id);
  return db.runTransaction(transaction => {
    var profileDoc = transaction.get(docRef);
    return profileDoc.then(doc => {
      if (doc.exists) {
        transaction.update(docRef, { deviceToken: deviceToken });
        return {
          code: 200,
          message:
            "Successfully updated the deviceToken associated with this profile",
          status: "SUCCESS",
          referenceId: id
        };
      } else {
        return {
          code: 500,
          message: "A profile with that id does not exist",
          status: "FAILED",
          referenceId: id
        };
      }
    });
  });
}

export function disableProfile(id) {
  var docRef = db.collection(collectionName).doc(id);
  return db
    .runTransaction(transaction => {
      return transaction.get(docRef).then(doc => {
        if (doc.exists) {
          if (doc.data().status == "Disabled") {
            throw new Error("Profile is already disabled");
          }
          transaction.update(docRef, { status: "Disabled" });
        } else {
          throw new Error("Document does not exist");
        }
      });
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully disabled profile",
        code: 200
      };
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A profile with that id does not exist",
          code: 404
        };
      } else if ((error.message = "Profile is already disabled")) {
        return {
          referenceId: id,
          status: "Failure",
          message: "The request profile is already disabled",
          code: 400
        };
      } else {
        return {
          referenceId: id,
          status: "Failure",
          message: "An unknown error occured",
          code: 500
        };
      }
    });
}

export function enableProfile(id) {
  var docRef = db.collection(collectionName).doc(id);
  return db
    .runTransaction(transaction => {
      return transaction.get(docRef).then(doc => {
        if (doc.exists) {
          if (doc.data().status != "Disabled") {
            throw new Error("Profile is already active");
          }
          transaction.update(docRef, { status: "Active" });
        } else {
          throw new Error("Document does not exist");
        }
      });
    })
    .then(() => {
      return {
        referenceId: id,
        status: "Success",
        message: "Successfully enabled profile",
        code: 200
      };
    })
    .catch(error => {
      console.log(error);
      if (error.message == "Document does not exist") {
        return {
          referenceId: id,
          status: "Failure",
          message: "A profile with that id does not exist",
          code: 404
        };
      } else if (error.message == "Profile is already active") {
        return {
          referenceId: id,
          status: "Failure",
          message: "The requested profile is already active",
          code: 400
        };
      } else {
        return {
          referenceId: id,
          status: "Failure",
          message: "An unknown error occured",
          code: 500
        };
      }
    });
}
