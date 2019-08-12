"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const typeDefs = `
type Game {
    id: String!
    current_spin: Int
    name: String
    scores(limit: Int, after: String): PagedScore
    question_categories(limit: Int, after: String): PagedQuestionCategory
    selected_question: Question
    players: [Profile]
    round: Int
    free_spins(limit: Int, after: String): PagedFreeSpin
    answers: PagedAnswer
    state: String
    sub_state: String
    owner: Profile
    answer_timeout: Int
    createdAt: String
    updatedAt: String
}

type PagedGame {
    data: [Game],
    count: Int,
    cursor: String
}

extend type Query {
    Game(id: String): Game
    Games(limit: Int!, after: String): PagedGame
}

extend type Mutation {
    createGame(name: String, question_categories: [String]): Game
    joinGame(id: String): Status
    leaveGame(id: String): Status
    deleteGame(id: String): Status
}
`;
var _default = typeDefs;
exports.default = _default;