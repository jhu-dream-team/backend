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

export default typeDefs;
