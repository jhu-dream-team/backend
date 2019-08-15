const typeDefs = `
type Game {
    id: String!
    current_spin: String
    spins: Int
    name: String
    scores(limit: Int, after: String): PagedScore
    question_categories(limit: Int, after: String): PagedQuestionCategory
    selected_question: Question
    players(limit: Int, after: String): PagedProfile
    round: Int
    free_spins(limit: Int, after: String): PagedFreeSpin
    answers(limit: Int, after: String): PagedAnswer
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
    Games(limit: Int, after: String): PagedGame
}

extend type Mutation {
    createGame(name: String, question_categories: [String]): Game
    joinGame(id: String): Status
    leaveGame(id: String): Status
    spinWheel(id: String): Game
    completeTurn(id: String): Status
    selectCategory(id: String, category_id: String): Game
    answerQuestion(id: String, answer: String): Game
    voteAnswer(id: String, correct: Boolean): Status
    startGame(id: String): Status
    deleteGame(id: String): Status
}
`;

export default typeDefs;
