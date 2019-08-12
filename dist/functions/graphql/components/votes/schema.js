"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const typeDefs = `
type Vote {
    id: String!
    answer: Answer
    game: Game
    approve: Boolean
    owner: Profile
    createdAt: String
    updatedAt: String
}

type PagedVote {
    data: [Vote],
    count: Int,
    cursor: String
}

extend type Query {
    Vote(id: String): Answer
    Votes(limit: Int!, after: String): PagedVote
}
`;
var _default = typeDefs;
exports.default = _default;