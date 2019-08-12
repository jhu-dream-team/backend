"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserById = getUserById;
exports.checkExistingEmail = checkExistingEmail;
exports.createProfile = createProfile;
exports.updateProfile = updateProfile;
exports.updateDeviceToken = updateDeviceToken;
exports.disableProfile = disableProfile;
exports.enableProfile = enableProfile;

var _server = require("../../server");

var _utils = require("../../utils");

var _firebaseFunctions = _interopRequireDefault(require("firebase-functions"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const {
  make
} = require = require("no-avatar");

let transactions = [];
let resultObj = {};
let resultDoc;
let replaceId;
const collectionName = "users";

function getUserById(id) {
  return _server.db.collection(collectionName).doc(id).get().then(doc => {
    if (!doc.exists) {
      resultObj = {
        data: null,
        error: new Error("Profile does not exist")
      };
    }

    var parsedData = (0, _utils.transformFirestoreToJson)(doc);
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

function checkExistingEmail(_x) {
  return _checkExistingEmail.apply(this, arguments);
}

function _checkExistingEmail() {
  _checkExistingEmail = _asyncToGenerator(function* (email) {
    var emailExistsSet;
    return _server.db.runTransaction(transaction => {
      if (email != null) {
        return transaction.get(_server.db.collection(collectionName).where("email", "==", email)).then(snapshot => {
          if (snapshot.size > 0) {
            return _firebaseAdmin.default.auth().getUserByEmail(snapshot.docs[0].data().email).then(user => {
              return user;
            }).catch(err => {
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
  });
  return _checkExistingEmail.apply(this, arguments);
}

function createProfile(_x2, _x3, _x4, _x5, _x6) {
  return _createProfile.apply(this, arguments);
}

function _createProfile() {
  _createProfile = _asyncToGenerator(function* (user_id, firstName, lastName, email, deviceToken) {
    var userRecord;

    try {
      userRecord = yield this.checkExistingEmail(email);
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

    return _server.db.collection(collectionName).doc(user_id).get().then(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* (doc) {
        if (doc.exists) {
          resultObj = {
            data: null,
            error: new Error("A profile with that id already exists")
          };
          return resultObj;
        }

        yield _server.db.collection(collectionName).doc(user_id).set({
          createdAt: (0, _utils.getCurrentUnix)(),
          updatedAt: (0, _utils.getCurrentUnix)(),
          lastActivity: (0, _utils.getCurrentUnix)(),
          status: "Active",
          firstName: firstName,
          lastName: lastName,
          email: email,
          deviceToken: deviceToken || null
        });
        return _server.db.collection(collectionName).doc(user_id).get().then(doc => {
          resultObj = {
            data: (0, _utils.transformFirestoreToJson)(doc),
            error: null
          };
          return resultObj;
        });
      });

      return function (_x7) {
        return _ref.apply(this, arguments);
      };
    }()).catch(err => {
      console.log("[ERROR] Creating User Account: ", err);
      resultObj = {
        data: null,
        error: new Error("An error occured while creating Profile")
      };
      return resultObj;
    });
  });
  return _createProfile.apply(this, arguments);
}

function updateProfile(id, ip, args) {
  var updateInfo = {};

  for (var property in args) {
    if (args.hasOwnProperty(property)) {
      updateInfo[property] = args[property];
    }
  }

  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    return transaction.get(docRef).then(doc => {
      if (doc.exists) {
        transaction.update(docRef, Object.assign(updateInfo, {
          updatedAt: (0, _utils.getCurrentUnix)()
        }));
        resultDoc = Object.assign({}, (0, _utils.transformFirestoreToJson)(doc), updateInfo);
      } else {
        throw new Error("Document does not exist");
      }
    });
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully updated user profile",
      code: 200
    };
  }).catch(error => {
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

function updateDeviceToken(id, deviceToken) {
  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    var profileDoc = transaction.get(docRef);
    return profileDoc.then(doc => {
      if (doc.exists) {
        transaction.update(docRef, {
          deviceToken: deviceToken
        });
        return {
          code: 200,
          message: "Successfully updated the deviceToken associated with this profile",
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

function disableProfile(id) {
  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    return transaction.get(docRef).then(doc => {
      if (doc.exists) {
        if (doc.data().status == "Disabled") {
          throw new Error("Profile is already disabled");
        }

        transaction.update(docRef, {
          status: "Disabled"
        });
      } else {
        throw new Error("Document does not exist");
      }
    });
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully disabled profile",
      code: 200
    };
  }).catch(error => {
    console.log(error);

    if (error.message == "Document does not exist") {
      return {
        referenceId: id,
        status: "Failure",
        message: "A profile with that id does not exist",
        code: 404
      };
    } else if (error.message = "Profile is already disabled") {
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

function enableProfile(id) {
  var docRef = _server.db.collection(collectionName).doc(id);

  return _server.db.runTransaction(transaction => {
    return transaction.get(docRef).then(doc => {
      if (doc.exists) {
        if (doc.data().status != "Disabled") {
          throw new Error("Profile is already active");
        }

        transaction.update(docRef, {
          status: "Active"
        });
      } else {
        throw new Error("Document does not exist");
      }
    });
  }).then(() => {
    return {
      referenceId: id,
      status: "Success",
      message: "Successfully enabled profile",
      code: 200
    };
  }).catch(error => {
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