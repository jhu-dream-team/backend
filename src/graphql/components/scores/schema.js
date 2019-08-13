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
    Score(id: String): Score
    Scores(limit: Int!, after: String, owner: String): PagedScore
}
`;

export default typeDefs;
