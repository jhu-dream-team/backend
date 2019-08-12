"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const typeDefs = `
type FreeSpin {
    id: String!
    game: Game
    value: Int
    owner: Profile
    createdAt: String
    updatedAt: String
}

type PagedFreeSpin {
    data: [Answer],
    count: Int,
    cursor: String
}

extend type Query {
    FreeSpin(id: String): FreeSpin
    FreeSpins(limit: Int!, after: String): PagedFreeSpin
}
`;
var _default = typeDefs;
exports.default = _default;