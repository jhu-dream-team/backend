"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const typeDefs = `
type Profile {
    id: String!
    firstName: String
    lastName: String
    email: String
    createdAt: String
    updatedAt: String
    status: String
    lastActivity: String
    profileImg: String
    games(limit: Int, after: String): PagedGame
    question_categories(limit: Int, after: String): PagedQuestionCategory
    scores(limit: Int, after: String): PagedScore
    deviceToken: String
}

type PagedProfile {
    data: [Profile]
    count: Int
    cursor: String
}

type ProfileRequest {
    user_id: String,
    firstName: String!,
    lastName: String!
    email: String!
}

type Query {
    Profile: Profile
}

type Mutation {
    createProfile(user_id: String, firstName: String!, lastName: String, email: String!, deviceToken: String): Profile
    updateProfile(email: String, firstName: String, lastName: String): Status
    updateDeviceToken(deviceToken: String): Status
    disableProfile: Status
}
`;
var _default = typeDefs;
exports.default = _default;