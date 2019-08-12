"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const typeDefs = `
type Answer {
    id: String!
    value: String
    award: Float
    question: Question
    owner: Profile
    score: Score
    game: Game
    votes: PagedVote
    deadline: Int
    createdAt: String
    updatedAt: String
}

type PagedAnswer {
    data: [Answer],
    count: Int,
    cursor: String
}

extend type Query {
    Answer(id: String): Answer
    Answers(limit: Int!, after: String): PagedAnswer
}
`;
var _default = typeDefs;
exports.default = _default;