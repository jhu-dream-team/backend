"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const typeDefs = `
type Score {
    id: String!
    type: String
    value: Float
    modifier: Int
    round: Int
    game: Game
    answers(limit: Int, after: String): PagedAnswer
    owner: Profile
    createdAt: String
    updatedAt: String
}

type PagedScore {
    data: [Score],
    count: Int,
    cursor: String
}

extend type Query {
    Score(id: String): PagedScore
    Scores(limit: Int!, after: String, owner: String): PagedScore
}
`;
var _default = typeDefs;
exports.default = _default;