const typeDefs = `
type Question {
    id: String!
    question: String
    suggested_answer: String
    max_points: Int
    question_category: QuestionCategory
    owner: Profile
    createdAt: String
    updatedAt: String
}

type PagedQuestion {
    data: [Question],
    count: Int,
    cursor: String
}

extend type Query {
    Question(id: String, random: Boolean, question_category: String): Question
    getQuestionsByQuestionCategory(question_category_id: String!, limit: Int, after: String): PagedQuestion
    Questions(limit: Int!, after: String, owner: Boolean): PagedQuestion
}

extend type Mutation {
    createQuestion(question: String!, suggested_answer: String!, max_points: Int!, question_category_id: String!): Question
    updateQuestion(id: String!, question: String, suggested_answer: String, max_points: Int, question_category: String): Status
    deleteQuestion(id: String!): Status
}
`;

export default typeDefs;
