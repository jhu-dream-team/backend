const typeDefs = `
type QuestionCategory {
    id: String!
    name: String
    owner: Profile
    questions(limit: Int, after: String): PagedQuestion
    createdAt: String
    updatedAt: String
}

type PagedQuestionCategory {
    data: [QuestionCategory],
    count: Int,
    cursor: String
}

extend type Query {
    QuestionCategory(id: String): QuestionCategory
    QuestionCategories(limit: Int!, after: String, owner: Boolean): PagedQuestionCategory
}

extend type Mutation {
    createQuestionCategory(name: String!): QuestionCategory
    updateQuestionCategory(id: String!, name: String): Status
    deleteQuestionCategory(id: String!): Status
}
`;

export default typeDefs;
